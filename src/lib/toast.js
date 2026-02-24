import { toast } from 'sonner';

export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 3000,
      ...options,
    });
  },
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 4000,
      ...options,
    });
  },
  info: (message, options = {}) => {
    return toast.info(message, {
      duration: 3000,
      ...options,
    });
  },
  warning: (message, options = {}) => {
    return toast.warning(message, {
      duration: 3000,
      ...options,
    });
  },
  promise: (promise, messages, options = {}) => {
    return toast.promise(promise, messages, options);
  },
};

// Confirm dialog is now in ConfirmDialog.jsx component
// Import it from '@/components/ConfirmDialog' when needed

export default showToast;
