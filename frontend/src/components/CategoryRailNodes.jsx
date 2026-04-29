import { useEffect, useState } from 'react';
import { Nodes, readApiError } from '../services/api.js';

/**
 * Compact, read-only preview of the nodes inside a category. Used inside
 * the rail's expanded drop-down. Lazy-fetched on first expansion.
 *
 * Node operations (DnD reorder, inline create / edit) live on the dedicated
 * /categories/:id page where there's room — the rail is a glance.
 */
function CategoryRailNodes({ categoryId }) {
  const [nodes, setNodes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // The parent re-mounts this component on each expansion (the dropdown
    // is a conditional render), so initial state is already null/null —
    // no setState reset needed at the top of the effect.
    let cancelled = false;
    Nodes.list({ categoryId })
      .then((data) => {
        if (!cancelled) setNodes(data);
      })
      .catch((err) => {
        if (!cancelled) setError(readApiError(err, 'Failed to load nodes'));
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  if (error) {
    return <div className="rail-nodes-state error-text">{error}</div>;
  }
  if (nodes === null) {
    return <div className="rail-nodes-state muted">Loading nodes…</div>;
  }
  if (nodes.length === 0) {
    return <div className="rail-nodes-state muted">No nodes yet.</div>;
  }

  const tree = buildTree(nodes);

  return (
    <ul className="rail-nodes" role="tree">
      {tree.map((n) => (
        <RailNode key={n._id} node={n} depth={0} />
      ))}
    </ul>
  );
}

function RailNode({ node, depth }) {
  return (
    <li
      className="rail-node"
      role="treeitem"
      style={{ paddingLeft: depth * 12 }}
    >
      <span className="rail-node-label" title={primaryLabel(node)}>
        {primaryLabel(node)}
      </span>
      {node.children.length > 0 && (
        <ul className="rail-nodes" role="group">
          {node.children.map((c) => (
            <RailNode key={c._id} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function buildTree(nodes) {
  const byId = new Map(nodes.map((n) => [n._id, { ...n, children: [] }]));
  const roots = [];
  for (const n of byId.values()) {
    if (n.parentId && byId.has(n.parentId)) {
      byId.get(n.parentId).children.push(n);
    } else {
      roots.push(n);
    }
  }
  // Order siblings by `order` (already sorted by the API, but defensive).
  const sortChildren = (list) => {
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const n of list) sortChildren(n.children);
  };
  sortChildren(roots);
  return roots;
}

function primaryLabel(node) {
  // Show the first text-ish value the node has — name/title/label first,
  // otherwise the first non-empty value, otherwise a placeholder.
  const v = node.values ?? {};
  const candidates = [v.name, v.title, v.label];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c;
  }
  for (const val of Object.values(v)) {
    if (typeof val === 'string' && val.trim()) return val;
    if (typeof val === 'number') return String(val);
  }
  return '(unnamed)';
}

export default CategoryRailNodes;
