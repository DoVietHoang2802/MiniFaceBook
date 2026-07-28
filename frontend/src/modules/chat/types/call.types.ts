export type CallSignalType = 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'REJECT' | 'END' | 'CANCEL';

export interface CallSignalMessage {
  type: CallSignalType;
  callerId: string;
  callerName?: string;
  callerAvatar?: string;
  calleeId: string;
  sdp?: any;
  candidate?: any;
  isVideo?: boolean;
}

export type CallStatus = 'IDLE' | 'CALLING' | 'RINGING' | 'CONNECTED';
