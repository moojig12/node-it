import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Categories, readApiError } from '../services/api.js';
import CategoryForm from '../components/category/CategoryForm.jsx';
import { useToasts } from '../hooks/useToasts.js';

function CategoriesPage() {
  const [list, setList] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const toasts = useToasts();

  const refresh = async () => {
    try {
      const data = await Categories.list();
      setList(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(readApiError(err, 'Failed to load categories'));
    }
  };

  useEffect(() => {
    let cancelled = false;
    Categories.list()
      .then((data) => {
        if (!cancelled) {
          setList(data);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(readApiError(err, 'Failed to load categories'));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async (payload) => {
    setBusy(true);
    try {
      const created = await Categories.create(payload);
      toasts.success(`Created "${created.name}"`);
      setCreating(false);
      refresh();
    } catch (err) {
      toasts.error(readApiError(err, 'Could not create category'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (cat) => {
    const confirmed = window.confirm(
      `Delete category "${cat.name}"?\n\nIf nodes exist, you'll be asked whether to cascade.`,
    );
    if (!confirmed) return;
    try {
      await Categories.remove(cat._id);
      toasts.success(`Deleted "${cat.name}"`);
      refresh();
    } catch (err) {
      if (err.response?.status === 409) {
        const count = err.response.data?.error?.match(/(\d+)/)?.[1] ?? 'some';
        const cascade = window.confirm(
          `"${cat.name}" has ${count} node(s). Delete them too?`,
        );
        if (cascade) {
          try {
            await Categories.remove(cat._id, { force: true });
            toasts.success(`Deleted "${cat.name}" and its nodes`);
            refresh();
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
    <>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Define shapes — each category is a schema for a kind of node.</p>
        </div>
        <div className="header-actions">
          {!creating && (
            <button className="primary" onClick={() => setCreating(true)}>
              + New category
            </button>
          )}
        </div>
      </div>

      {creating && (
        <div className="stack-md" style={{ marginBottom: 24 }}>
          <CategoryForm
            submitLabel="Create category"
            busy={busy}
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {loadError && <div className="error-text">{loadError}</div>}

      {list === null && !loadError && <div className="loading">Loading…</div>}

      {list && list.length === 0 && !creating && (
        <div className="empty">
          No categories yet. Click <strong>+ New category</strong> to start.
        </div>
      )}

      {list && list.length > 0 && (
        <div className="cat-list">
          {list.map((cat) => (
            <div key={cat._id} className="cat-card">
              <Link
                to={`/categories/${cat._id}`}
                style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}
              >
                <strong>{cat.name}</strong>
                <span className="cat-meta">
                  {cat.fields.length} field{cat.fields.length === 1 ? '' : 's'}
                  {cat.identityKeys?.length
                    ? ` · identity: ${cat.identityKeys.join(', ')}`
                    : ''}
                  {cat.description ? ` · ${cat.description}` : ''}
                </span>
              </Link>
              <div className="btn-row">
                <Link to={`/categories/${cat._id}`} className="btn-link">
                  open →
                </Link>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(cat)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default CategoriesPage;
