import { useState, useEffect, useRef, useCallback } from 'react';
import { webSocketService } from '../services/webSocketService';
import type { CallSignalMessage, CallStatus } from '../types/call.types';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export interface WebRTCCallCompletedSummary {
  status: 'CONNECTED' | 'MISSED';
  isVideo: boolean;
  durationSecs: number;
  peerId: string;
  initiatedByMe: boolean;
}

export const useWebRTCCall = (
  currentUser: any,
  onCallCompleted?: (summary: WebRTCCallCompletedSummary) => void
) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('IDLE');
  const [incomingCall, setIncomingCall] = useState<CallSignalMessage | null>(null);
  const [activeCall, setActiveCall] = useState<CallSignalMessage | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  const activeCallRef = useRef<CallSignalMessage | null>(null);
  const incomingCallRef = useRef<CallSignalMessage | null>(null);
  const callStatusRef = useRef<CallStatus>('IDLE');
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentUserRef = useRef(currentUser);
  const onCallCompletedRef = useRef(onCallCompleted);
  const ringingTimeoutRef = useRef<any>(null);
  const ringingDeadlineRef = useRef<number | null>(null);
  const connectedStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    onCallCompletedRef.current = onCallCompleted;
  }, [onCallCompleted]);

  useEffect(() => {
    if (callStatus === 'CONNECTED') {
      connectedStartTimeRef.current = Date.now();
    }
  }, [callStatus]);

  // Send signaling message via STOMP /app/call.signal
  const sendSignal = useCallback((message: CallSignalMessage) => {
    webSocketService.send('/app/call.signal', message);
  }, []);

  // Safe media stream fetch with Smart Fallback (Video -> Audio -> Empty)
  const getMediaStreamSafe = async (reqVideo: boolean): Promise<{ stream: MediaStream; isVideo: boolean }> => {
    try {
      if (reqVideo) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          return { stream, isVideo: true };
        } catch {
          console.warn('[WebRTC] Camera busy/unavailable on device, falling back to Audio-only');
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          return { stream: audioStream, isVideo: false };
        }
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        return { stream, isVideo: false };
      }
    } catch (err) {
      console.warn('[WebRTC] Media permission denied or hardware unavailable:', err);
      return { stream: new MediaStream(), isVideo: false };
    }
  };

  // Clean up WebRTC peer connection & media streams
  const cleanupCall = useCallback(() => {
    const user = currentUserRef.current;
    const onCallCompleted = onCallCompletedRef.current;

    if (callStatusRef.current !== 'IDLE' && onCallCompleted) {
      const isConn = callStatusRef.current === 'CONNECTED';
      const durationSecs =
        isConn && connectedStartTimeRef.current
          ? Math.max(1, Math.floor((Date.now() - connectedStartTimeRef.current) / 1000))
          : 0;

      const actCall = activeCallRef.current;
      const incCall = incomingCallRef.current;
      const peerId: string =
        (actCall?.calleeId === currentUser?.id
          ? actCall?.callerId
          : actCall?.calleeId || incCall?.callerId) || '';
      const callerId = actCall?.callerId || incCall?.callerId;

      const isVideo = !!(actCall?.isVideo || incCall?.isVideo);

      onCallCompleted({
        status: isConn ? 'CONNECTED' : 'MISSED',
        isVideo,
        durationSecs,
        peerId,
        initiatedByMe: callerId === user?.id,
      });
    }

    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    ringingDeadlineRef.current = null;
    if (peerConnRef.current) {
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallStatus('IDLE');
    setIncomingCall(null);
    setActiveCall(null);
    activeCallRef.current = null;
    incomingCallRef.current = null;
    callStatusRef.current = 'IDLE';
    connectedStartTimeRef.current = null;
    iceCandidatesQueue.current = [];
  }, []);

  const sendEndSignal = useCallback(() => {
    const user = currentUserRef.current;
    if (callStatusRef.current === 'IDLE' || !user?.id) return;

    const active = activeCallRef.current;
    const incoming = incomingCallRef.current;
    const targetId =
      active?.calleeId === user.id
        ? active?.callerId
        : active?.calleeId || incoming?.callerId;

    if (targetId) {
      sendSignal({
        callId: active?.callId || incoming?.callId,
        type: 'END',
        callerId: user.id,
        calleeId: targetId,
      });
    }
  }, [sendSignal]);

  // End active call
  const endCall = useCallback(() => {
    sendEndSignal();
    cleanupCall();
  }, [sendEndSignal, cleanupCall]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (incomingCallRef.current && currentUser?.id) {
      sendSignal({
        callId: incomingCallRef.current.callId,
        type: 'REJECT',
        callerId: currentUser.id,
        calleeId: incomingCallRef.current.callerId,
      });
    }
    cleanupCall();
  }, [currentUser?.id, sendSignal, cleanupCall]);

  // Create PeerConnection & setup handlers
  const createPeerConnection = useCallback(
    (targetUserId: string, callId: string) => {
      const pc = new RTCPeerConnection(STUN_SERVERS);

      pc.onicecandidate = (event) => {
        if (event.candidate && currentUser?.id) {
          sendSignal({
            callId,
            type: 'ICE_CANDIDATE',
            callerId: currentUser.id,
            calleeId: targetUserId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      peerConnRef.current = pc;
      return pc;
    },
    [currentUser?.id, sendSignal]
  );

  // Initiate a new call (Caller)
  const startCall = async (
    calleeId: string,
    calleeName: string,
    isVideo: boolean = false,
    calleeAvatar?: string
  ) => {
    try {
      cleanupCall();
      callStatusRef.current = 'CALLING';
      setCallStatus('CALLING');

      const { stream, isVideo: actualIsVideo } = await getMediaStreamSafe(isVideo);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const callId = crypto.randomUUID();
      const pc = createPeerConnection(calleeId, callId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const callInfo: CallSignalMessage = {
        callId,
        type: 'OFFER',
        callerId: currentUser?.id || '',
        callerName: currentUser?.name || 'Người dùng',
        callerAvatar: currentUser?.avatar,
        calleeId: calleeId,
        sdp: offer,
        isVideo: actualIsVideo,
      };

      const active = { ...callInfo, callerName: calleeName, callerAvatar: calleeAvatar };
      activeCallRef.current = active;
      setActiveCall(active);
      sendSignal(callInfo);
    } catch (err) {
      console.error('Error starting WebRTC call:', err);
      cleanupCall();
    }
  };

  // Accept incoming call (Callee)
  const acceptCall = async () => {
    if (!incomingCall?.callId) return;

    try {
      const reqVideo = !!incomingCall.isVideo;
      const { stream } = await getMediaStreamSafe(reqVideo);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(incomingCall.callerId, incomingCall.callId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (incomingCall.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.sdp));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      activeCallRef.current = incomingCall;
      incomingCallRef.current = null;
      callStatusRef.current = 'CONNECTED';
      setActiveCall(incomingCall);
      setCallStatus('CONNECTED');
      setIncomingCall(null);

      sendSignal({
        callId: incomingCall.callId,
        type: 'ANSWER',
        callerId: currentUser?.id || '',
        calleeId: incomingCall.callerId,
        sdp: answer,
      });

      // Process queued candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    } catch (err) {
      console.error('Error accepting WebRTC call:', err);
      rejectCall();
    }
  };

  // Try to signal before the socket closes; server-side disconnect handling is the fallback.
  useEffect(() => {
    const handlePageExit = () => {
      sendEndSignal();
      cleanupCall();
    };

    window.addEventListener('beforeunload', handlePageExit);
    window.addEventListener('pagehide', handlePageExit);
    return () => {
      window.removeEventListener('beforeunload', handlePageExit);
      window.removeEventListener('pagehide', handlePageExit);
    };
  }, [sendEndSignal, cleanupCall]);

  useEffect(() => {
    return () => {
      sendEndSignal();
      cleanupCall();
    };
  }, [sendEndSignal, cleanupCall]);

  // 30s Ringing Timeout safety
  useEffect(() => {
    if (callStatus === 'CALLING' || callStatus === 'RINGING') {
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
      }
      const deadline = ringingDeadlineRef.current ?? Date.now() + 30000;
      ringingDeadlineRef.current = deadline;
      const timeout = window.setTimeout(() => {
        console.warn('[WebRTC] Ringing 30s timeout reached, ending call');
        endCall();
      }, Math.max(0, deadline - Date.now()));
      ringingTimeoutRef.current = timeout;

      return () => {
        clearTimeout(timeout);
        if (ringingTimeoutRef.current === timeout) {
          ringingTimeoutRef.current = null;
        }
      };
    }

    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    if (callStatus === 'CONNECTED' || callStatus === 'IDLE') {
      ringingDeadlineRef.current = null;
    }
  }, [callStatus, endCall]);

  // Handle incoming signaling messages from STOMP topic /topic/call/{currentUser.id}
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = webSocketService.subscribe<CallSignalMessage>(
      `/topic/call/${currentUser.id}`,
      async (msg) => {
        const currentCallId = activeCallRef.current?.callId || incomingCallRef.current?.callId;
        switch (msg.type) {
          case 'OFFER': {
            if (!msg.callId) return;
            if (callStatusRef.current !== 'IDLE') {
              // Auto-reject if busy
              sendSignal({
                callId: msg.callId,
                type: 'REJECT',
                callerId: currentUser.id,
                calleeId: msg.callerId,
              });
              return;
            }
            incomingCallRef.current = msg;
            callStatusRef.current = 'RINGING';
            setIncomingCall(msg);
            setCallStatus('RINGING');
            break;
          }

          case 'ANSWER': {
            if (peerConnRef.current && msg.sdp && msg.callId === currentCallId) {
              await peerConnRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              callStatusRef.current = 'CONNECTED';
              setCallStatus('CONNECTED');
              // Process queued ICE candidates
              while (iceCandidatesQueue.current.length > 0) {
                const candidate = iceCandidatesQueue.current.shift();
                if (candidate) {
                  await peerConnRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
              }
            }
            break;
          }

          case 'ICE_CANDIDATE': {
            if (msg.candidate && msg.callId === currentCallId) {
              if (peerConnRef.current && peerConnRef.current.remoteDescription) {
                await peerConnRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
              } else {
                iceCandidatesQueue.current.push(msg.candidate);
              }
            }
            break;
          }

          case 'REJECT':
          case 'CANCEL':
          case 'END': {
            if (msg.callId === currentCallId) {
              cleanupCall();
            }
            break;
          }

          default:
            break;
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id, sendSignal, cleanupCall]);

  // Mute / Unmute Mic
  const toggleMic = (muted: boolean) => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  };

  const toggleCamera = (disabled: boolean) => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !disabled;
      });
    }
  };

  return {
    callStatus,
    incomingCall,
    activeCall,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
  };
};
