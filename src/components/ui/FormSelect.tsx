import React from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ElementType;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
}

export default function FormSelect({
  label,
  icon: Icon,
  helpText,
  error,
  className = '',
  id,
  children,
  ...props
}: FormSelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
        <select
          id={id}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white appearance-none cursor-pointer ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
      </div>
      {error && (
        <p className="text-xs font-bold text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{helpText}</p>
      )}
    </div>
  );
}
