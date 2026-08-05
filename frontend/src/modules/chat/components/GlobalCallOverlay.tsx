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
    const width = 288;
    const height = 176;
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
          className="fixed z-[999998] h-44 w-72 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl"
          style={position ? { left: position.x, top: position.y } : { right: 16, bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={() => { dragOffsetRef.current = null; }}
        >
          {isVideo && remoteStream ? (
            <video ref={remotePreviewRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-violet-700 text-5xl font-bold">
              {peerAvatar ? <img src={peerAvatar} alt="" className="h-full w-full object-cover" /> : peerName[0]?.toUpperCase()}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-transparent p-3 pt-10">
            <div className="min-w-0 cursor-grab active:cursor-grabbing">
              <div className="truncate text-sm font-bold">
              {peerName}
              </div>
              <p className="mt-0.5 text-xs text-violet-100">{callStatus === 'CONNECTED' ? 'Cuộc gọi đang diễn ra' : 'Đang gọi...'}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onRestore} className="rounded-xl bg-slate-700/90 p-2 hover:bg-slate-600" title="Mở lại cuộc gọi" aria-label="Mở lại cuộc gọi">
                <Maximize2 className="h-4 w-4" />
              </button>
              <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onEndCall} className="rounded-xl bg-red-600 p-2 hover:bg-red-500" title="Kết thúc cuộc gọi" aria-label="Kết thúc cuộc gọi">
                <PhoneOff className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        , document.body
      )}
    </>
  );
}
