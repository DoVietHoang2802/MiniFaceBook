import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Maximize2, PhoneOff } from 'lucide-react';
import { createPortal } from 'react-dom';
import ActiveCallModal from './ActiveCallModal';
import IncomingCallModal from './IncomingCallModal';
import type { CallSignalMessage, CallStatus } from '../types/call.types';

interface GlobalCallOverlayProps {
  callStatus: CallStatus;
  incomingCall: CallSignalMessage | null;
  activeCall: CallSignalMessage | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  minimized: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEndCall: () => void;
  onRestore: () => void;
  onMinimize: () => void;
  onToggleMic: (muted: boolean) => void;
  onToggleCamera: (disabled: boolean) => void;
}

export default function GlobalCallOverlay({
  callStatus,
  incomingCall,
  activeCall,
  localStream,
  remoteStream,
  minimized,
  onAccept,
  onReject,
  onEndCall,
  onRestore,
  onMinimize,
  onToggleMic,
  onToggleCamera,
}: GlobalCallOverlayProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const remotePreviewRef = useRef<HTMLVideoElement>(null);
  const isCallActive = callStatus === 'CALLING' || callStatus === 'CONNECTED';
  const peerName = activeCall?.callerName || incomingCall?.callerName || 'Người dùng';
  const peerAvatar = activeCall?.callerAvatar || incomingCall?.callerAvatar;
  const isVideo = Boolean(activeCall?.isVideo || incomingCall?.isVideo);

  useEffect(() => {
    if (remotePreviewRef.current && remoteStream) {
      remotePreviewRef.current.srcObject = remoteStream;
      void remotePreviewRef.current.play().catch(() => {});
    }
  }, [minimized, remoteStream]);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const offset = dragOffsetRef.current;
    if (!offset) return;
    const width = 240;
    const height = 96;
    setPosition({
      x: Math.max(8, Math.min(event.clientX - offset.x, window.innerWidth - width - 8)),
      y: Math.max(8, Math.min(event.clientY - offset.y, window.innerHeight - height - 8)),
    });
  };

  if (incomingCall) {
    return <IncomingCallModal incomingCall={incomingCall} onAccept={onAccept} onReject={onReject} />;
  }

  if (!isCallActive) return null;

  return (
    <>
      <ActiveCallModal
        status={callStatus}
        peerName={peerName}
        peerAvatar={peerAvatar}
        localStream={localStream}
        remoteStream={remoteStream}
        isVideo={isVideo}
        minimized={minimized}
        onEndCall={onEndCall}
        onMinimize={onMinimize}
        onToggleMic={onToggleMic}
        onToggleCamera={onToggleCamera}
      />
      {minimized && createPortal(
        <div
          className="fixed z-[999998] flex h-24 w-60 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/95 text-white shadow-2xl backdrop-blur"
          style={position ? { left: position.x, top: position.y } : { right: 16, bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={() => { dragOffsetRef.current = null; }}
        >
          {isVideo && remoteStream ? (
            <video ref={remotePreviewRef} autoPlay muted playsInline className="h-full w-24 shrink-0 object-cover" />
          ) : (
            <div className="flex h-full w-20 shrink-0 items-center justify-center bg-violet-700 text-xl font-bold">
              {peerAvatar ? <img src={peerAvatar} alt="" className="h-full w-full object-cover" /> : peerName[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1 p-2">
            <div className="cursor-grab truncate text-xs font-bold active:cursor-grabbing">
              {peerName}
            </div>
            <p className="mt-1 text-[11px] text-violet-200">{callStatus === 'CONNECTED' ? 'Cuộc gọi đang diễn ra' : 'Đang gọi...'}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onRestore} className="rounded-lg bg-slate-700 p-1.5 hover:bg-slate-600" title="Mở lại cuộc gọi" aria-label="Mở lại cuộc gọi">
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onEndCall} className="rounded-lg bg-red-600 p-1.5 hover:bg-red-500" title="Kết thúc cuộc gọi" aria-label="Kết thúc cuộc gọi">
                <PhoneOff className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
        , document.body
      )}
    </>
  );
}
