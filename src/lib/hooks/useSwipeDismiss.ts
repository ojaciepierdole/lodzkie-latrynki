import { useRef, useCallback } from 'react';

const DISMISS_THRESHOLD = 80;

export function useSwipeDismiss(onDismiss: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const dragState = useRef({ startY: 0, currentY: 0, dragging: false });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = ref.current;
    if (!el) return;
    // Only start drag if sheet is scrolled to top
    if (el.scrollTop > 0) return;
    dragState.current = { startY: e.touches[0].clientY, currentY: 0, dragging: true };
    el.style.transition = 'none';
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const ds = dragState.current;
    const el = ref.current;
    if (!ds.dragging || !el) return;
    const dy = e.touches[0].clientY - ds.startY;
    if (dy < 0) return;
    ds.currentY = dy;
    el.style.transform = `translateY(${dy}px)`;
  }, []);

  const onTouchEnd = useCallback(() => {
    const ds = dragState.current;
    const el = ref.current;
    if (!ds.dragging || !el) return;
    ds.dragging = false;
    el.style.transition = 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)';
    if (ds.currentY > DISMISS_THRESHOLD) {
      el.style.transform = 'translateY(100%)';
      onDismiss();
    } else {
      el.style.transform = 'translateY(0)';
    }
  }, [onDismiss]);

  return { ref, onTouchStart, onTouchMove, onTouchEnd };
}
