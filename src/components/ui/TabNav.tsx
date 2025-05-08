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
      <nav className="-mb-px flex flex-wrap space-x-2  overflow-visible whitespace-nowrap whitespace-normal">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`${
              activeTabId === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 group'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300 group'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <div className="flex items-center">
              <span className="text-inherit">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-small ${
                  activeTabId === tab.id
                    ? 'text-inherit'
                    : 'text-inherit'
                }`}>
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabNav; 