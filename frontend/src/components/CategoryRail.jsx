import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Categories, readApiError } from '../services/api.js';
import { useCategoryList } from '../hooks/useCategoryList.js';
import { useCategoryEdit } from '../hooks/useCategoryEdit.js';
import { useToasts } from '../hooks/useToasts.js';
import CategoryForm from './category/CategoryForm.jsx';
import CategoryRailNodes from './CategoryRailNodes.jsx';

/**
 * Always-visible left rail.
 *
 * Structure:
 *   .cat-rail
 *     .rail-brand       ← brand mark, separator below
 *     .rail-content     ← scrollable: header (label + new), create form, list
 *
 * Each list row is a drop-down: chevron / name button / edit pencil / delete.
 */
function CategoryRail() {
  const { list, error, refresh } = useCategoryList();
  const editModal = useCategoryEdit();
  const toasts = useToasts();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(() => new Set());
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async (payload) => {
    setBusy(true);
    try {
      const created = await Categories.create(payload);
      toasts.success(`Created "${created.name}"`);
      setCreating(false);
      await refresh();
    } catch (err) {
      toasts.error(readApiError(err, 'Could not create category'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (cat) => {
    if (
      !window.confirm(
        `Delete category "${cat.name}"?\n\nIf nodes exist, you'll be asked whether to cascade.`,
      )
    )
      return;
    try {
      await Categories.remove(cat._id);
      toasts.success(`Deleted "${cat.name}"`);
      await refresh();
    } catch (err) {
      if (err.response?.status === 409) {
        const count = err.response.data?.error?.match(/(\d+)/)?.[1] ?? 'some';
        if (window.confirm(`"${cat.name}" has ${count} node(s). Delete them too?`)) {
          try {
            await Categories.remove(cat._id, { force: true });
            toasts.success(`Deleted "${cat.name}" and its nodes`);
            await refresh();
          } catch (err2) {
            toasts.error(readApiError(err2, 'Cascade delete failed'));
          }
        }
      } else {
        toasts.error(readApiError(err, 'Delete failed'));
      }
    }
  };

  return (
    <aside className="cat-rail" aria-label="Categories">
      <NavLink to="/" className="rail-brand" end>
        <span className="brand-dot" aria-hidden="true" />
        <span>Node It</span>
      </NavLink>

      <div className="rail-content">
        <div className="rail-header">
          <h2>Categories</h2>
          {!creating && (
            <button
              type="button"
              className="btn-ghost rail-add"
              onClick={() => setCreating(true)}
              aria-label="New category"
            >
              + New
            </button>
          )}
        </div>

        {creating && (
          <div className="rail-create">
            <CategoryForm
              submitLabel="Create"
              busy={busy}
              onSave={handleCreate}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {error && <div className="error-text rail-error">{error}</div>}
        {list === null && !error && (
          <div className="rail-nodes-state muted">Loading…</div>
        )}
        {list && list.length === 0 && !creating && (
          <div className="rail-nodes-state muted">No categories yet.</div>
        )}

        {list && list.length > 0 && (
          <ul className="rail-list" role="tree">
            {list.map((cat) => {
              const isExpanded = expanded.has(cat._id);
              return (
                <li key={cat._id} className="rail-item" role="treeitem">
                  <div className={`rail-row${isExpanded ? ' expanded' : ''}`}>
                    <button
                      type="button"
                      className={`rail-chevron${isExpanded ? ' open' : ''}`}
                      onClick={() => toggleExpanded(cat._id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? `Collapse ${cat.name}` : `Expand ${cat.name}`}
                    >
                      <svg viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M4 2 L8 6 L4 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="rail-name-button"
                      onClick={() => navigate(`/categories/${cat._id}`)}
                      title={`Open ${cat.name}`}
                    >
                      <span className="rail-name">{cat.name}</span>
                      <span className="rail-meta">
                        {cat.fields.length} field{cat.fields.length === 1 ? '' : 's'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="rail-icon-btn"
                      onClick={() => editModal.open(cat)}
                      aria-label={`Edit ${cat.name}`}
                      title="Edit category"
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true" width="14" height="14">
                        <path d="M11 1.5 L14.5 5 L5 14.5 L1 14.5 L1 10.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M9.5 3 L13 6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="rail-icon-btn rail-delete"
                      onClick={() => handleDelete(cat)}
                      aria-label={`Delete ${cat.name}`}
                      title="Delete category"
                    >
                      ×
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="rail-expanded">
                      <CategoryRailNodes categoryId={cat._id} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

export default CategoryRail;
