import { toast, ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  position: 'bottom-left',
  duration: 5000,
  style: {
    fontSize: '14px',
  },
};

export const notifySuccess = (message: string) => toast.success(message, defaultOptions);
export const notifyError = (message: string) => toast.error(message, defaultOptions);
export const notify = (message: string) => toast(message, defaultOptions);
export const notifyLoading = (message: string) => toast.loading(message, defaultOptions);
export const dismissToast = (id?: string) => toast.dismiss(id); 