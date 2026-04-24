import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Categories, readApiError } from '../services/api.js';
import { useTree } from '../hooks/useTree.js';
import { useToasts } from '../hooks/useToasts.js';
import TreeView from '../components/tree/TreeView.jsx';
import CategoryAggregate from '../components/tree/CategoryAggregate.jsx';
import CategoryForm from '../components/category/CategoryForm.jsx';

function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toasts = useToasts();
  const [category, setCategory] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const tree = useTree(id);

  const refreshCategory = async () => {
    try {
      setCategory(await Categories.get(id));
    } catch (err) {
      setLoadError(readApiError(err, 'Failed to load category'));
    }
  };

  useEffect(() => {
    let cancelled = false;
    Categories.get(id)
      .then((data) => {
        if (!cancelled) {
          setCategory(data);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(readApiError(err, 'Failed to load category'));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSaveCategory = async (payload) => {
    setSaving(true);
    try {
      await Categories.update(id, payload);
      toasts.success('Category updated');
      setEditing(false);
      refreshCategory();
    } catch (err) {
      toasts.error(readApiError(err, 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (
      !window.confirm(
        `Delete category "${category.name}"?\n\nThis will remove all nodes if you confirm cascade.`,
      )
    )
      return;
    try {
      await Categories.remove(id);
      toasts.success('Category deleted');
      navigate('/categories');
    } catch (err) {
      if (err.response?.status === 409) {
        const count = err.response.data?.error?.match(/(\d+)/)?.[1] ?? 'some';
        if (window.confirm(`Has ${count} node(s). Cascade delete them?`)) {
          try {
            await Categories.remove(id, { force: true });
            toasts.success('Category and nodes deleted');
            navigate('/categories');
          } catch (err2) {
            toasts.error(readApiError(err2, 'Cascade delete failed'));
          }
        }
      } else {
        toasts.error(readApiError(err, 'Delete failed'));
      }
    }
  };

  if (loadError) return <div className="error-text">{loadError}</div>;
  if (!category) return <div className="loading">Loading category…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="muted" style={{ marginBottom: 4 }}>
            <Link to="/categories">← All categories</Link>
          </p>
          <h1>{category.name}</h1>
          {category.description && <p>{category.description}</p>}
          <p className="card-subtle" style={{ marginTop: 4 }}>
            {category.fields.map((f) => f.label).join(' · ')}
            {category.identityKeys?.length
              ? ` · merges on: ${category.identityKeys.join(', ')}`
              : ''}
          </p>
        </div>
        <div className="header-actions">
          {!editing && (
            <>
              <button onClick={() => setEditing(true)}>Edit schema</button>
              <button className="btn-danger" onClick={handleDeleteCategory}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div style={{ marginBottom: 24 }}>
          <CategoryForm
            initial={category}
            submitLabel="Save changes"
            busy={saving}
            onSave={handleSaveCategory}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      <CategoryAggregate category={category} tree={tree} />

      {tree.loadError ? (
        <div className="error-text">{tree.loadError}</div>
      ) : tree.nodes === null ? (
        <div className="loading">Loading nodes…</div>
      ) : (
        <TreeView category={category} tree={tree} />
      )}
    </>
  );
}

export default CategoryDetail;
