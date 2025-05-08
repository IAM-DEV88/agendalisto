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
      <nav className="-mb-px flex flex-wrap md:space-x-2 overflow-visible whitespace-nowrap whitespace-normal">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`${
              activeTabId === tab.id
                ? 'border-indigo-600 text-indigo-800 dark:text-indigo-200 font-bold border-b-2'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-b-2'
            } whitespace-nowrap py-4 px-1 font-medium text-sm`}
          >
            <div className="flex items-center">
              <span className={`${activeTabId === tab.id ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                  activeTabId === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
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