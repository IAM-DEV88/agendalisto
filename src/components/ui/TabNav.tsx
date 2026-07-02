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
  variant?: 'underline' | 'pill';
}

export const TabNav: React.FC<TabNavProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  sticky,
  variant = 'underline',
}) => {
  // ─── Scroll trigger & sticky bar offsets ───
  const PILL_BAR_TOP = 108;
  const PILL_TRIGGER_OFFSET = 108;
  const UNDERLINE_TRIGGER_OFFSET = 65;
  // ─────────────────────────────────────────────

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !sticky) return;
    const offset = variant === 'pill' ? PILL_TRIGGER_OFFSET : UNDERLINE_TRIGGER_OFFSET;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: `-${offset}px 0px 0px 0px` }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sticky, variant]);

  useEffect(() => {
    const btn = document.getElementById(`tab-${activeTabId}`);
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTabId]);

  const pillNav = (
    <div className="bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl inline-flex items-center gap-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTabId === tab.id
              ? 'bg-white dark:bg-slate-900 shadow-sm text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <span>{tab.label}</span>
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md text-[10px] font-black transition-colors ${
              activeTabId === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  if (variant === 'pill') {
    if (!sticky) return pillNav;

    return (
      <>
        <div
          ref={sentinelRef}
          className={`shrink-0 transition-all duration-300 ${
            stuck ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {pillNav}
        </div>
        <div
          className={`fixed left-0 right-0 z-30 transition-all duration-200 ease-out ${
            stuck
              ? 'translate-y-0 opacity-100'
              : '-translate-y-2 opacity-0 pointer-events-none'
          }`}
          style={{ top: `${PILL_BAR_TOP}px` }}
        >
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex justify-start">
              {pillNav}
            </div>
          </div>
        </div>
      </>
    );
  }

  const nav = (
    <nav className="flex overflow-x-auto no-scrollbar gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={`group relative flex items-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTabId === tab.id
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <span>{tab.label}</span>
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-black transition-colors ${
              activeTabId === tab.id
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {tab.count}
            </span>
          )}
          {activeTabId === tab.id && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full animate-in fade-in slide-in-from-bottom-0.5 duration-200" />
          )}
        </button>
      ))}
    </nav>
  );

  if (sticky) {
    return (
      <>
        <div
          ref={sentinelRef}
          className={`transition-all duration-300 border-b border-slate-200/50 dark:border-slate-800/50 ${
            stuck ? 'opacity-0 pointer-events-none' : ''
          }`}
        >
          {nav}
        </div>
        <div
          className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
            stuck
              ? 'translate-y-0 opacity-100'
              : '-translate-y-2 opacity-0 pointer-events-none'
          }`}
          style={{ top: '4rem' }}
        >
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {nav}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-200">
      {nav}
    </div>
  );
};

export default TabNav;
