import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import type { CallSignalMessage } from '../types/call.types';

interface IncomingCallModalProps {
  incomingCall: CallSignalMessage;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  incomingCall,
  onAccept,
  onReject,
}) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<any>(null);

  // Play synthesized ringtone sound effect
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
        
        const playRingtoneBeep = () => {
          if (!audioCtxRef.current) return;
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') {
            void ctx.resume();
          }
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc2.frequency.setValueAtTime(480, ctx.currentTime);

          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 1.2);
          osc2.stop(ctx.currentTime + 1.2);
        };

        playRingtoneBeep();
        intervalRef.current = setInterval(playRingtoneBeep, 2500);
      }
    } catch (e) {
      console.warn('Audio ringtone failed to start automatically:', e);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center text-white relative overflow-hidden">
        {/* Animated Background Waves */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-64 h-64 rounded-full bg-violet-500 animate-ping" />
        </div>

        {/* Avatar */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-violet-500/50 shadow-lg bg-slate-800 flex items-center justify-center">
            {incomingCall.callerAvatar ? (
              <img
                src={incomingCall.callerAvatar}
                alt={incomingCall.callerName || 'Caller'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-violet-300">
                {(incomingCall.callerName || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-violet-600 p-2 rounded-full shadow">
            {incomingCall.isVideo ? <Video className="h-4 w-4 text-white" /> : <Phone className="h-4 w-4 text-white" />}
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-xl font-bold mb-1 text-slate-100">
          {incomingCall.callerName || 'Người dùng Vizo'}
        </h3>
        <p className="text-xs font-medium text-violet-400 mb-8 animate-pulse">
          {incomingCall.isVideo ? 'Cuộc gọi Video đến...' : 'Cuộc gọi Thoại đến...'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8 w-full z-10">
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg group-hover:scale-110">
              <PhoneOff className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-red-400">Từ chối</span>
          </button>

          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-2 group cursor-pointer animate-bounce"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-all shadow-lg group-hover:scale-110">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-400">Trả lời</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
