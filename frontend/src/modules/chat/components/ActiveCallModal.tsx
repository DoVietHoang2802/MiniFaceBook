import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Minimize2, PhoneOff } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { CallStatus } from '../types/call.types';

interface ActiveCallModalProps {
  status: CallStatus;
  peerName: string;
  peerAvatar?: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideo: boolean;
  minimized: boolean;
  onEndCall: () => void;
  onMinimize: () => void;
  onToggleMic: (muted: boolean) => void;
  onToggleCamera: (disabled: boolean) => void;
}

const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  status,
  peerName,
  peerAvatar,
  localStream,
  remoteStream,
  isVideo,
  minimized,
  onEndCall,
  onMinimize,
  onToggleMic,
  onToggleCamera,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraDisabled, setIsCameraDisabled] = useState(false);
  const [duration, setDuration] = useState(0);

  const attachLocalVideo = useCallback((video: HTMLVideoElement | null) => {
    localVideoRef.current = video;
    if (video && localStream && !isCameraDisabled) {
      video.srcObject = localStream;
      video.muted = true;
      video.playsInline = true;
      void video.play().catch(() => {});
    }
  }, [isCameraDisabled, localStream]);

  const attachRemoteVideo = useCallback((video: HTMLVideoElement | null) => {
    remoteVideoRef.current = video;
    if (video && remoteStream) {
      video.srcObject = remoteStream;
      video.playsInline = true;
      void video.play().catch(() => {});
    }
  }, [remoteStream]);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      void localVideoRef.current.play().catch(() => {});
    }
  }, [isCameraDisabled, isVideo, localStream]);

  // Attach remote stream to video & audio
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      void remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [isVideo, minimized, remoteStream]);

  // Duration timer when CONNECTED
  useEffect(() => {
    if (status !== 'CONNECTED') return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleMicToggle = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    onToggleMic(nextState);
  };

  const handleCameraToggle = () => {
    const nextState = !isCameraDisabled;
    setIsCameraDisabled(nextState);
    onToggleCamera(nextState);
  };

  const hasLocalVideo = Boolean(localStream?.getVideoTracks().length);

  if (minimized) {
    return createPortal(<audio ref={remoteAudioRef} autoPlay playsInline />, document.body);
  }

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-950 animate-fade-in">
      <div className="app-dynamic-height relative w-full overflow-hidden bg-slate-950 shadow-2xl">
        {/* Header Bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
              {peerAvatar ? (
                <img src={peerAvatar} alt={peerName || 'User'} className="w-full h-full object-cover" />
              ) : (
                (peerName || 'U')[0]?.toUpperCase()
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">{peerName || 'Người dùng'}</h4>
              <span className="text-xs text-emerald-400 font-mono">
                {status === 'CONNECTED' ? formatDuration(duration) : 'Đang kết nối...'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onMinimize}
            className="rounded-xl bg-slate-900/70 p-2 text-slate-100 shadow-lg transition hover:bg-slate-800"
            title="Thu nhỏ cuộc gọi"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
        </div>

        {/* Call Content Area */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-950">
          {isVideo && remoteStream ? (
            /* Remote Video */
            <video
              ref={attachRemoteVideo}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            /* Avatar Voice Call View */
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 rounded-full border-4 border-violet-500/40 p-1 mb-4 relative animate-pulse">
                {peerAvatar ? (
                  <img src={peerAvatar} alt={peerName || 'User'} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-violet-700 flex items-center justify-center text-4xl font-bold text-white">
                    {(peerName || 'U')[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-slate-400">
                {status === 'CONNECTED' ? 'Cuộc gọi đang diễn ra' : 'Đang chờ phản hồi...'}
              </p>
            </div>
          )}

          {/* Local Video Picture-in-Picture */}
          {isVideo && localStream && (
            <div className="absolute bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 h-40 w-28 overflow-hidden rounded-2xl border-2 border-violet-500/50 bg-slate-900 shadow-2xl sm:h-48 sm:w-36">
              {hasLocalVideo && !isCameraDisabled ? (
                <video
                  ref={attachLocalVideo}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={(event) => void event.currentTarget.play().catch(() => {})}
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] font-semibold text-slate-300">
                  {hasLocalVideo ? 'Camera off' : 'Camera unavailable'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Basic Control Bar */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-6 bg-gradient-to-t from-slate-950/90 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10">
          {/* Mute Mic Button */}
          <button
            onClick={handleMicToggle}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
            title={isMuted ? 'Mở Micro' : 'Tắt Micro'}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {isVideo && (
            <button
              onClick={handleCameraToggle}
              className={`rounded-2xl border p-3.5 transition-all cursor-pointer ${
                isCameraDisabled
                  ? 'border-red-500/40 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isCameraDisabled ? 'Bật camera' : 'Tắt camera'}
            >
              {isCameraDisabled ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="p-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all cursor-pointer shadow-lg hover:scale-105"
            title="Kết thúc cuộc gọi"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>

        {/* Hidden Audio Element for Remote Stream */}
        <audio ref={remoteAudioRef} autoPlay playsInline />
      </div>
    </div>,
    document.body
  );
};

export default ActiveCallModal;
