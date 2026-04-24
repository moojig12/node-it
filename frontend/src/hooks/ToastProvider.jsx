import { useCallback, useMemo, useRef, useState } from 'react';
import { ToastContext } from './toastContext.js';

// Lightweight toast queue. Each toast: { id, kind, message }.
// `kind` drives color: 'info' | 'success' | 'error' | 'merge'.
let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, { kind = 'info', timeout = 4000 } = {}) => {
      const id = ++idSeq;
      setToasts((list) => [...list, { id, kind, message }]);
      if (timeout > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), timeout),
        );
      }
      return id;
    },
    [dismiss],
  );

  // Wrap in useMemo so the context value is stable when nothing relevant changed.
  const value = useMemo(
    () => ({
      push,
      dismiss,
      toasts,
      info: (msg, opts) => push(msg, { kind: 'info', ...opts }),
      success: (msg, opts) => push(msg, { kind: 'success', ...opts }),
      error: (msg, opts) => push(msg, { kind: 'error', timeout: 6000, ...opts }),
      merge: (msg, opts) => push(msg, { kind: 'merge', ...opts }),
    }),
    [push, dismiss, toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
