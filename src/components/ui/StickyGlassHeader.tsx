import React from 'react';

interface StickyGlassHeaderProps {
  children: React.ReactNode;
  stuck: boolean;
  className?: string;
  'data-underline-nav'?: boolean;
}

const glassClasses =
  'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-800/50 w-[100vw] ml-[calc(-50vw+50%)] pl-[calc(50vw-50%)] pr-[calc(50vw-50%)]';

export const StickyGlassHeader: React.FC<StickyGlassHeaderProps> = ({
  children,
  stuck,
  className = '',
  ...attrs
}) => {
  return (
    <div
      {...(attrs['data-underline-nav'] !== undefined ? { 'data-underline-nav': '' } : {})}
      className={`sticky top-16 z-30 transition-colors duration-150 ${stuck ? glassClasses : 'bg-transparent'} ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        {children}
      </div>
    </div>
  );
};

export default StickyGlassHeader;
