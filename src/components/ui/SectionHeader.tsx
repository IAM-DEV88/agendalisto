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
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {actionButton && <div className="flex-shrink-0">{actionButton}</div>}
    </div>
  );
};

export default SectionHeader; 