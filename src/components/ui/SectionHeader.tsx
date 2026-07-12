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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mb-0">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0">{description}</p>
        )}
      </div>
      {actionButton && <div className="flex-shrink-0">{actionButton}</div>}
    </div>
  );
};

export default SectionHeader; 