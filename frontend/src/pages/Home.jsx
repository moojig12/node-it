import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Categories, readApiError } from '../services/api.js';

function Home() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Categories.list()
      .then(setList)
      .catch((e) => setErr(readApiError(e, 'Failed to load categories')));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Node It</h1>
          <p>Schema-driven, node-based notes. Pick a category to jump in.</p>
        </div>
        <div className="header-actions">
          <Link to="/categories" className="btn-link">
            Manage categories →
          </Link>
        </div>
      </div>

      {err && <div className="error-text">{err}</div>}
      {list === null && !err && <div className="loading">Loading…</div>}

      {list && list.length === 0 && (
        <div className="empty">
          No categories yet.{' '}
          <Link to="/categories">Create your first one →</Link>
        </div>
      )}

      {list && list.length > 0 && (
        <div className="cat-list">
          {list.map((cat) => (
            <Link key={cat._id} to={`/categories/${cat._id}`} className="cat-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong>{cat.name}</strong>
                <span className="cat-meta">
                  {cat.fields.length} field{cat.fields.length === 1 ? '' : 's'}
                  {cat.description ? ` · ${cat.description}` : ''}
                </span>
              </div>
              <span className="btn-link">open →</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default Home;
