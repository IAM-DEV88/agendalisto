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
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [pillPosition, setPillPosition] = useState(108);

  useEffect(() => {
    if (!sticky) return;

    if (variant === 'underline') {
      const barEl = document.querySelector('[data-underline-nav]');
      if (!barEl) return;
      const update = () => setStuck(barEl.getBoundingClientRect().top < 65);
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      };
    }

    const el = sentinelRef.current;
    if (!el) return;
    const underlineBar = document.querySelector('[data-underline-nav]');
    if (underlineBar) {
      const update = () => {
        const bottom = underlineBar.getBoundingClientRect().bottom;
        setPillPosition(bottom);
        setStuck(el.getBoundingClientRect().top <= bottom);
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sticky, variant]);

  useEffect(() => {
    const btn = document.getElementById(`tab-${activeTabId}`);
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTabId]);

  const pillNav = (
    <div className="overflow-x-auto no-scrollbar">
      <div className="bg-slate-100 dark:bg-slate-800/80 p-0.5 inline-flex items-center gap-0.5 w-max rounded-xl">
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
          <div className="py-2.5">{pillNav}</div>
        </div>
        <div
          className={`fixed left-0 right-0 z-30 transition-all duration-200 ease-out ${
            stuck
              ? 'translate-y-0 opacity-100'
              : '-translate-y-2 opacity-0 pointer-events-none'
          }`}
          style={{ top: `${pillPosition}px` }}
        >
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:pl-8 lg:px-8 py-2.5 flex justify-start">
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
          className={`group relative flex items-center gap-2 py-3 sm:py-3 px-4 sm:px-4 text-sm sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTabId === tab.id
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <span>{tab.label}</span>
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-2 rounded-md text-[11px] font-black transition-colors ${
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
      <div data-underline-nav className={`sticky top-16 z-40 transition-colors duration-150 ${
        stuck
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-800/50 sm:w-[100vw] sm:ml-[calc(-50vw+50%)] sm:pl-[calc(50vw-50%)] sm:pr-[calc(50vw-50%)]'
          : 'bg-transparent border-b border-slate-200/50 dark:border-slate-800/50'
      }`}>
        <div className="px-4 sm:px-0">{nav}</div>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-200">
      {nav}
    </div>
  );
};

export default TabNav;
