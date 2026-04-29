import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Categories, readApiError } from '../../services/api.js';
import { useToasts } from '../../hooks/useToasts.js';
import { useCategoryList } from '../../hooks/useCategoryList.js';
import CategoryForm from './CategoryForm.jsx';

/**
 * Modal shell for editing a category's schema. Hosts the existing
 * CategoryForm so the field-row UX stays identical — only the framing
 * changes from inline-on-page to overlay.
 *
 * Closes on Esc, on backdrop click, on Cancel, and after a successful save.
 * Locks body scroll while open so the canvas behind doesn't jiggle.
 */
function CategoryEditModal({ category, onClose }) {
  const toasts = useToasts();
  const { refresh: refreshList } = useCategoryList();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleSave = async (payload) => {
    setBusy(true);
    try {
      await Categories.update(category._id, payload);
      toasts.success('Category updated');
      await refreshList();
      onClose();
    } catch (err) {
      toasts.error(readApiError(err, 'Update failed'));
    } finally {
      setBusy(false);
    }
  };

  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onBackdropClick}
      role="presentation"
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit category ${category.name}`}
      >
        <header className="modal-header">
          <h2 className="modal-title">
            Edit <span className="modal-target">{category.name}</span>
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close edit dialog"
          >
            ×
          </button>
        </header>
        <div className="modal-body">
          <CategoryForm
            initial={category}
            submitLabel="Save changes"
            busy={busy}
            onSave={handleSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default CategoryEditModal;
