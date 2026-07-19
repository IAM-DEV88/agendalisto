import React from 'react';
import TabNav from './TabNav';
import type { Tab } from './TabNav';

interface ConnectedPillCardProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  className?: string;
  cardClassName?: string;
  sticky?: boolean;
}

export const ConnectedPillCard: React.FC<ConnectedPillCardProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  children,
  className = '',
  cardClassName = '',
  sticky = true,
}) => {
  return (
    <div className={className}>
      <TabNav
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={onTabChange}
        variant="pill"
        sticky={sticky}
        connected
      />
      <div className={`bg-white dark:bg-slate-900 rounded-b-lg border border-slate-100 dark:border-slate-800 p-4 md:p-6 -mt-px ${cardClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default ConnectedPillCard;
