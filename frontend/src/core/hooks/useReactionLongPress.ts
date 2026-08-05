import { useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';

const LONG_PRESS_DELAY = 450;

interface UseReactionLongPressOptions {
  onTap: () => void;
  onLongPress: () => void;
  onMouseClick: () => void;
}

export function useReactionLongPress({ onTap, onLongPress, onMouseClick }: UseReactionLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const lastPointerTypeRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onTap, onLongPress, onMouseClick });

  callbacksRef.current = { onTap, onLongPress, onMouseClick };

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' || !event.isPrimary) {
      lastPointerTypeRef.current = event.pointerType;
      return;
    }

    clearTimer();
    activePointerIdRef.current = event.pointerId;
    lastPointerTypeRef.current = event.pointerType;
    longPressTriggeredRef.current = false;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      longPressTriggeredRef.current = true;
      callbacksRef.current.onLongPress();
    }, LONG_PRESS_DELAY);
  };

  const finishPointer = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    clearTimer();
    activePointerIdRef.current = null;
  };

  const cancelPointer = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    clearTimer();
    activePointerIdRef.current = null;
    longPressTriggeredRef.current = false;
  };

  const onClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (longPressTriggeredRef.current) {
      event.preventDefault();
      longPressTriggeredRef.current = false;
      lastPointerTypeRef.current = null;
      return;
    }

    if (lastPointerTypeRef.current === 'touch' || lastPointerTypeRef.current === 'pen') {
      callbacksRef.current.onTap();
    } else {
      callbacksRef.current.onMouseClick();
    }
    lastPointerTypeRef.current = null;
  };

  return {
    onClick,
    onPointerDown,
    onPointerUp: finishPointer,
    onPointerCancel: cancelPointer,
    onPointerLeave: cancelPointer,
    onContextMenu: (event: ReactMouseEvent<HTMLElement>) => event.preventDefault(),
  };
}
