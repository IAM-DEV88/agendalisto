import React, { useEffect, useRef, useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  count?: number;
  status?: 'complete' | 'incomplete' | 'error';
}

interface TabNavProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  sticky?: boolean;
  variant?: 'underline' | 'pill';
  connected?: boolean;
}

export const TabNav: React.FC<TabNavProps> = React.memo(({
  tabs,
  activeTabId,
  onTabChange,
  sticky,
  variant = 'underline',
  connected,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [pillPosition, setPillPosition] = useState(64);

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTabId: string) => {
    const currentIndex = tabs.findIndex(t => t.id === currentTabId);
    let nextIndex = -1;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex >= 0 && nextIndex < tabs.length) {
      const nextTab = tabs[nextIndex];
      onTabChange(nextTab.id);
      const btn = document.getElementById(`tab-${nextTab.id}`);
      btn?.focus();
    }
  };

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
        const rect = underlineBar.getBoundingClientRect();
        setPillPosition(rect.bottom - 0);
        setStuck(el.getBoundingClientRect().top <= rect.bottom);
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      };
    }

    let stickyOffset = 64;
    (document.querySelectorAll('.sticky') as NodeListOf<HTMLElement>).forEach((s) => {
      if (s.contains(el) || el.contains(s)) return;
      const top = parseFloat(window.getComputedStyle(s).top) || 0;
      const bottom = top + s.offsetHeight;
      if (bottom > stickyOffset) stickyOffset = bottom;
    });
    stickyOffset += el.offsetHeight || 36;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStuck(!entry.isIntersecting);
        if (!entry.isIntersecting) {
          const stickyEls = document.querySelectorAll('.sticky');
          let maxBottom = 0;
          stickyEls.forEach((s) => {
            if (s.contains(el) || el.contains(s)) return;
            const r = s.getBoundingClientRect();
            if (r.bottom > maxBottom && r.top >= 0 && r.top < 200) maxBottom = r.bottom;
          });
          if (maxBottom > 0) setPillPosition(maxBottom);
        }
      },
      { threshold: 0, rootMargin: `-${stickyOffset}px 0px 0px 0px` }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [sticky, variant]);

  useEffect(() => {
    const btn = document.getElementById(`tab-${activeTabId}`);
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTabId]);

  const pillNav = (
    <div className="overflow-x-auto no-scrollbar" role="tablist" aria-orientation="horizontal" aria-label="Navegación de pestañas" onKeyDown={(e) => handleTabKeyDown(e, activeTabId)}>
      <div className="bg-slate-100 dark:bg-slate-800/80 p-0.5 inline-flex items-center gap-0.5 w-max rounded-t-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            tabIndex={activeTabId === tab.id ? 0 : -1}
            aria-selected={activeTabId === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex items-center gap-1.5 px-1.5 md:px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset ${
              activeTabId === tab.id
                ? 'bg-white dark:bg-slate-900 shadow-sm text-primary-600 dark:text-primary-400 rounded-t-lg rounded-b-none'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 rounded-lg'
            }`}
          >
            {tab.status && (
              <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                tab.status === 'complete'
                  ? 'bg-emerald-500'
                  : tab.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-slate-400 dark:bg-slate-500'
              }`} />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-lg text-[10px] font-black transition-colors ${
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
          className={`shrink-0 transition-opacity duration-300 ${
            stuck ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className={connected ? '' : 'py-2.5'}>{pillNav}</div>
        </div>
        <div
          className={`fixed left-0 right-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all duration-200 ease-out ${
            stuck
              ? 'translate-y-0 opacity-100'
              : '-translate-y-2 opacity-0 pointer-events-none'
          }`}
          style={{ top: `${pillPosition}px` }}
        >
          <div className={`max-w-7xl mx-auto px-4 ${connected ? 'pt-2.5' : 'py-2.5'} flex justify-start`}>
            <div className="overflow-x-auto no-scrollbar" role="tablist" aria-orientation="horizontal" aria-label="Navegación de pestañas" onKeyDown={(e) => handleTabKeyDown(e, activeTabId)}>
              <div className="w-max rounded-t-lg">
                <div className="bg-slate-100 dark:bg-slate-800 p-0.5 inline-flex items-center gap-0.5 rounded-t-lg">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      role="tab"
                      tabIndex={activeTabId === tab.id ? 0 : -1}
                      aria-selected={activeTabId === tab.id}
                      aria-controls={`panel-${tab.id}`}
                      onClick={() => onTabChange(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-1.5 md:px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset ${
                        activeTabId === tab.id
                          ? 'bg-white dark:bg-slate-900 shadow-sm text-primary-600 dark:text-primary-400 rounded-t-lg rounded-b-none'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 rounded-lg'
                      }`}
                    >
                      {tab.status && (
                        <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                          tab.status === 'complete'
                            ? 'bg-emerald-500'
                            : tab.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-slate-400 dark:bg-slate-500'
                        }`} />
                      )}
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-lg text-[10px] font-black transition-colors ${
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
            </div>
          </div>
        </div>
      </>
    );
  }

  const nav = (
    <nav className="flex overflow-x-auto no-scrollbar tabnav-x-scroll gap-1" role="tablist" aria-orientation="horizontal" aria-label="Navegación de pestañas" onKeyDown={(e) => handleTabKeyDown(e, activeTabId)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          role="tab"
          tabIndex={activeTabId === tab.id ? 0 : -1}
          aria-selected={activeTabId === tab.id}
          aria-controls={`panel-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={`group relative flex items-center gap-2 py-3 sm:py-3 px-2 md:px-4 text-sm sm:text-sm font-bold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded-sm ${
            activeTabId === tab.id
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          {tab.status && (
            <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
              tab.status === 'complete'
                ? 'bg-emerald-500'
                : tab.status === 'error'
                  ? 'bg-red-500'
                  : 'bg-slate-300 dark:bg-slate-600'
            }`} />
          )}
          <span>{tab.label}</span>
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-2 rounded-lg text-[11px] font-black transition-colors ${
              activeTabId === tab.id
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {tab.count}
            </span>
          )}
          {activeTabId === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full animate-in fade-in slide-in-from-bottom-0.5 duration-200" />
          )}
        </button>
      ))}
    </nav>
  );

  if (sticky) {
    return (
      <div data-underline-nav className={`sticky top-16 z-40 transition-colors duration-150 ${
        stuck
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-800/50 w-[100vw] ml-[calc(-50vw+50%)] pl-[calc(50vw-50%)] pr-[calc(50vw-50%)]'
          : 'bg-transparent border-b border-slate-200/50 dark:border-slate-800/50'
      }`}>
        <div>{nav}</div>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-200">
      {nav}
    </div>
  );
});

export default TabNav;
