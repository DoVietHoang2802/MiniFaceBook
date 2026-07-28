import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import type { CallStatus } from '../types/call.types';

interface ActiveCallModalProps {
  status: CallStatus;
  peerName: string;
  peerAvatar?: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideo: boolean;
  onEndCall: () => void;
  onToggleMic: (muted: boolean) => void;
}

const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  status,
  peerName,
  peerAvatar,
  localStream,
  remoteStream,
  isVideo,
  onEndCall,
  onToggleMic,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video & audio
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 backdrop-blur-lg animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full h-[520px] shadow-2xl flex flex-col relative overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between z-20">
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
        </div>

        {/* Call Content Area */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          {isVideo && remoteStream ? (
            /* Remote Video */
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
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
            <div className="absolute bottom-4 right-4 w-36 h-48 bg-slate-900 border-2 border-violet-500/50 rounded-2xl overflow-hidden shadow-2xl z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            </div>
          )}
        </div>

        {/* Basic Control Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-6 z-20">
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
    </div>
  );
};

export default ActiveCallModal;
