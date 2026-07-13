import { useRef, useCallback, useEffect } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipeable(
  elRef: React.RefObject<HTMLElement | null>,
  handlers: SwipeHandlers,
  threshold = 30,
) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const moved = useRef(false);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    tracking.current = true;
    moved.current = false;
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!tracking.current) return;
    const dx = Math.abs(clientX - startX.current);
    if (dx > threshold) moved.current = true;
  }, [threshold]);

  const handleEnd = useCallback((clientX: number, clientY: number) => {
    if (!tracking.current) return;
    tracking.current = false;
    if (!moved.current) return;

    const dx = clientX - startX.current;
    const dy = clientY - startY.current;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      if (dx > 0) handlers.onSwipeRight?.();
      else handlers.onSwipeLeft?.();
    }
  }, [handlers, threshold]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const isSwipeBlocked = (target: EventTarget | null) =>
      (target as HTMLElement)?.closest?.('[data-swipe-block]');

    const onTouchStart = (e: TouchEvent) => {
      if (isSwipeBlocked(e.target)) return;
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isSwipeBlocked(e.target)) return;
      handleMove(e.touches[0].clientX);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking.current) return;
      handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (isSwipeBlocked(e.target)) return;
      handleStart(e.clientX, e.clientY);

      const onMouseMove = (me: MouseEvent) => handleMove(me.clientX);
      const onMouseUp = (me: MouseEvent) => {
        handleEnd(me.clientX, me.clientY);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('mousedown', onMouseDown);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('mousedown', onMouseDown);
    };
  }, [elRef, handleStart, handleMove, handleEnd]);
}
