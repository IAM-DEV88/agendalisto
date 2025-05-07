import React, { useEffect } from 'react';

export interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabNavProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
}

export const TabNav: React.FC<TabNavProps> = ({ 
  tabs, 
  activeTabId, 
  onTabChange 
}) => {
  // Scroll tab into view when active
  useEffect(() => {
    const btn = document.getElementById(`tab-${activeTabId}`);
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTabId]);

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-2 overflow-x-auto whitespace-nowrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`${
              activeTabId === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 text-gray-500 dark:text-gray-400">{tab.count}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabNav; 