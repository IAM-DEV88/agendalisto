import React, { useEffect, useRef, useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabNavProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  sticky?: boolean;
}

export const TabNav: React.FC<TabNavProps> = ({ 
  tabs, 
  activeTabId, 
  onTabChange,
  sticky
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !sticky) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sticky]);

  useEffect(() => {
    const btn = document.getElementById(`tab-${activeTabId}`);
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTabId]);

  const nav = (
    <nav className="-mb-px flex flex-wrap md:space-x-4 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={`group relative whitespace-nowrap py-4 px-2 font-black text-sm transition-all ${
            activeTabId === tab.id
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-colors ${
                activeTabId === tab.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
              }`}>
                {tab.count}
              </span>
            )}
          </div>
          {activeTabId === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 dark:bg-primary-400 rounded-t-full animate-in fade-in slide-in-from-bottom-1 duration-300"></div>
          )}
        </button>
      ))}
    </nav>
  );

  if (sticky) {
    return (
      <>
        <div ref={sentinelRef} className="h-px" />
        <div className={`sticky top-16 z-40 border-b transition-all duration-300 px-4 sm:px-0 ${
          stuck
            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-sm'
            : 'bg-transparent border-transparent'
        }`}>
          {nav}
        </div>
      </>
    );
  }

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      {nav}
    </div>
  );
};

export default TabNav; 