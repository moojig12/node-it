import { useContext } from 'react';
import { ToastContext } from './toastContext.js';

// Consumer hook. The provider lives in ToastProvider.jsx; they share the
// context object via toastContext.js.
export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToasts must be used inside <ToastProvider />');
  return ctx;
}
