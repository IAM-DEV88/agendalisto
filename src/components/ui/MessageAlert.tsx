import React from 'react';

interface MessageAlertProps {
  message: { text: string; type: 'success' | 'error' } | null;
  className?: string;
  onDismiss?: () => void;
}

export const MessageAlert: React.FC<MessageAlertProps> = ({
  message,
  className = '',
  onDismiss
}) => {
  if (!message) return null;

  const isSuccess = message.type === 'success';
  const baseClasses = 'p-4 rounded-lg mb-4';
  const typeClasses = isSuccess 
    ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-200'
    : 'bg-red-50 text-red-800 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-200';

  return (
    <div className={`${baseClasses} ${typeClasses} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {isSuccess ? (
            <svg className="h-5 w-5 text-green-400 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-400 dark:text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">{isSuccess ? 'Éxito' : 'Error'}</h3>
          <div className="mt-2 text-sm">
            <p>{message.text}</p>
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isSuccess 
                    ? 'text-green-500 hover:bg-green-100 focus:ring-green-600 dark:text-green-400 dark:hover:bg-green-800'
                    : 'text-red-500 hover:bg-red-100 focus:ring-red-600 dark:text-red-400 dark:hover:bg-red-800'
                }`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageAlert; 