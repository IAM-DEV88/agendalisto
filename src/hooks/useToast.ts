import { notifySuccess, notifyError } from '../lib/toast';

export interface ToastResult {
  success: (message: string) => void;
  error: (message: string) => void;
  custom: (message: string, type: 'success' | 'error') => void;
}

export const useToast = (): ToastResult => {
  const success = (message: string) => {
    notifySuccess(message);
  };

  const error = (message: string) => {
    notifyError(message);
  };

  const custom = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      notifySuccess(message);
    } else {
      notifyError(message);
    }
  };

  return { success, error, custom };
}; 