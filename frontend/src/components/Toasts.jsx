import { useToasts } from '../hooks/useToasts.js';

// Renders the current toast stack fixed to the bottom-right.
// Lives once in <Layout />; content comes from ToastProvider.
function Toasts() {
  const { toasts, dismiss } = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <span className="toast-message">{t.message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => dismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toasts;
