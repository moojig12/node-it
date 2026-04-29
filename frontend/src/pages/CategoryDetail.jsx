import { Link, useParams, useNavigate } from 'react-router-dom';
import { Categories, readApiError } from '../services/api.js';
import { useTree } from '../hooks/useTree.js';
import { useToasts } from '../hooks/useToasts.js';
import { useCategoryList } from '../hooks/useCategoryList.js';
import { useCategoryEdit } from '../hooks/useCategoryEdit.js';
import TreeView from '../components/tree/TreeView.jsx';
import CategoryAggregate from '../components/tree/CategoryAggregate.jsx';

/**
 * Detail page for a single category — full tree + aggregate strip. Schema
 * editing is no longer inline; "Edit schema" opens the popup instead.
 *
 * Reads the category itself out of the shared rail list so saves from the
 * modal flow back here automatically (refreshList in the modal updates
 * the context, which re-renders this page).
 */
function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toasts = useToasts();
  const { list, error: listError, refresh: refreshList } = useCategoryList();
  const editModal = useCategoryEdit();

  const tree = useTree(id);
  const category = list?.find((c) => c._id === id) ?? null;

  const handleDelete = async () => {
    if (!category) return;
    if (
      !window.confirm(
        `Delete category "${category.name}"?\n\nThis will remove all nodes if you confirm cascade.`,
      )
    )
      return;
    try {
      await Categories.remove(id);
      toasts.success('Category deleted');
      refreshList();
      navigate('/');
    } catch (err) {
      if (err.response?.status === 409) {
        const count = err.response.data?.error?.match(/(\d+)/)?.[1] ?? 'some';
        if (window.confirm(`Has ${count} node(s). Cascade delete them?`)) {
          try {
            await Categories.remove(id, { force: true });
            toasts.success('Category and nodes deleted');
            refreshList();
            navigate('/');
          } catch (err2) {
            toasts.error(readApiError(err2, 'Cascade delete failed'));
          }
        }
      } else {
        toasts.error(readApiError(err, 'Delete failed'));
      }
    }
  };

  if (listError) return <div className="error-text">{listError}</div>;
  if (list && !category) {
    return <div className="error-text">Category not found.</div>;
  }
  if (!category) return <div className="loading">Loading category…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="muted" style={{ marginBottom: 4 }}>
            <Link to="/">← Canvas</Link>
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
          <button onClick={() => editModal.open(category)}>Edit schema</button>
          <button className="btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

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
