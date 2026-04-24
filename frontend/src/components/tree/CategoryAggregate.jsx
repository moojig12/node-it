import { useEffect, useState } from 'react';
import { Nodes, readApiError } from '../../services/api.js';
import AggregateStrip from './AggregateStrip.jsx';

// Fetches the aggregate for the currently-selected node and renders the strip.
// Re-fetches any time the selection changes OR the tree is mutated
// (we detect mutations via the `nodes` reference changing).
function CategoryAggregate({ category, tree }) {
  const { selectedId, nodes } = tree;
  const [aggregate, setAggregate] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!selectedId) return; // aggregate/err stay from previous run, but we hide them below
    let cancelled = false;
    Nodes.aggregate(selectedId)
      .then((res) => {
        if (!cancelled) {
          setAggregate(res);
          setErr(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setErr(readApiError(e, 'Aggregate load failed'));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, nodes]);

  if (!selectedId) {
    return (
      <div className="aggregate-strip" style={{ color: 'var(--text-muted)' }}>
        <span>Select a node to see subtree totals.</span>
      </div>
    );
  }
  if (err) return <div className="error-text">{err}</div>;
  if (!aggregate) return null;

  return <AggregateStrip aggregate={aggregate} category={category} />;
}

export default CategoryAggregate;
