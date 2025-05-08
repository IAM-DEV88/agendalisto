import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  description, 
  actionButton 
}) => {
  return (
    <div className="sm:flex sm:items-center sm:justify-between mb-2">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 ">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {actionButton && <div className="mt-3 sm:mt-0 sm:ml-4">{actionButton}</div>}
    </div>
  );
};

export default SectionHeader; 