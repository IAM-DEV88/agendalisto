import { useRef, useCallback } from 'react';
import { useSwipeable } from './useSwipeable';

interface Tab { id: string; label: string; }

export function useSwipeTabs<T extends HTMLElement = HTMLDivElement>(
  tabs: Tab[],
  activeTab: string,
  onTabChange: (id: string) => void,
) {
  const contentRef = useRef<T>(null);

  useSwipeable(contentRef, {
    onSwipeLeft: useCallback(() => {
      const idx = tabs.findIndex(t => t.id === activeTab);
      if (idx < tabs.length - 1) onTabChange(tabs[idx + 1].id);
    }, [tabs, activeTab, onTabChange]),
    onSwipeRight: useCallback(() => {
      const idx = tabs.findIndex(t => t.id === activeTab);
      if (idx > 0) onTabChange(tabs[idx - 1].id);
    }, [tabs, activeTab, onTabChange]),
  });

  return contentRef;
}
