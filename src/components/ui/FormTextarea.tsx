import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  icon?: React.ElementType;
  helpText?: string;
  error?: string;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(({
  label,
  icon: Icon,
  helpText,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute top-3.5 left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 rounded-lg border ${error ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs font-bold text-red-500 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{helpText}</p>
      )}
    </div>
  );
});

FormTextarea.displayName = 'FormTextarea';

export default FormTextarea;
