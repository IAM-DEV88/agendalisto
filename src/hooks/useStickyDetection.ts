import { useState, useEffect, useRef } from 'react';

export function useStickyDetection<T extends HTMLElement = HTMLDivElement>(offset = 65, enabled = true) {
  const ref = useRef<T>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const update = () => setStuck(el.getBoundingClientRect().top < offset);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [offset, enabled]);

  return { ref, stuck };
}
