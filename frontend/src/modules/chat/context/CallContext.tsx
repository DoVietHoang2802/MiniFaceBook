import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWebRTCCall } from '../hooks/useWebRTCCall';
import GlobalCallOverlay from '../components/GlobalCallOverlay';
import { webSocketService } from '../services/webSocketService';

interface CallContextValue {
  callStatus: ReturnType<typeof useWebRTCCall>['callStatus'];
  startCall: (calleeId: string, calleeName: string, isVideo?: boolean, calleeAvatar?: string, conversationId?: string) => Promise<void>;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [minimized, setMinimized] = useState(false);
  const activeConversationIdRef = useRef<string | null>(null);
  const wasOnChatRouteRef = useRef(location.pathname.startsWith('/chats'));
  useWebSocket(Boolean(user));
  const handleCallCompleted = useCallback((summary: { status: 'CONNECTED' | 'MISSED'; isVideo: boolean; durationSecs: number; initiatedByMe: boolean }) => {
    const conversationId = activeConversationIdRef.current;
    if (!summary.initiatedByMe || !conversationId) return;

    const duration = `${String(Math.floor(summary.durationSecs / 60)).padStart(2, '0')}:${String(summary.durationSecs % 60).padStart(2, '0')}`;
    const content = summary.status === 'CONNECTED'
      ? summary.isVideo ? `📹 Cuộc gọi video đã kết thúc • ${duration}` : `📞 Cuộc gọi thoại đã kết thúc • ${duration}`
      : summary.isVideo ? '📹 Cuộc gọi video nhỡ' : '📞 Cuộc gọi thoại nhỡ';
    webSocketService.send('/app/chat.send', { conversationId, content, type: 'TEXT' });
  }, []);
  const call = useWebRTCCall(user, handleCallCompleted);

  const startCall: CallContextValue['startCall'] = (calleeId, calleeName, isVideo, calleeAvatar, conversationId) => {
    activeConversationIdRef.current = conversationId ?? null;
    setMinimized(false);
    return call.startCall(calleeId, calleeName, isVideo, calleeAvatar);
  };

  const isCallActive = call.callStatus === 'CALLING' || call.callStatus === 'CONNECTED';
  const isOnChatRoute = location.pathname.startsWith('/chats');
  useEffect(() => {
    if (wasOnChatRouteRef.current && !isOnChatRoute && isCallActive) {
      setMinimized(true);
    }
    wasOnChatRouteRef.current = isOnChatRoute;
  }, [isCallActive, isOnChatRoute]);

  return (
    <CallContext.Provider value={{ startCall, callStatus: call.callStatus }}>
      {children}
      <GlobalCallOverlay
        callStatus={call.callStatus}
        incomingCall={call.incomingCall}
        activeCall={call.activeCall}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        minimized={minimized}
        onAccept={() => {
          setMinimized(false);
          void call.acceptCall();
        }}
        onReject={call.rejectCall}
        onEndCall={call.endCall}
        onRestore={() => setMinimized(false)}
        onMinimize={() => setMinimized(true)}
        onToggleMic={call.toggleMic}
        onToggleCamera={call.toggleCamera}
      />
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
}
