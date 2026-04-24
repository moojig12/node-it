import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TreeNode from './TreeNode.jsx';
import NodeValuesEditor from './NodeValuesEditor.jsx';

function emptyValues(fields) {
  const obj = {};
  for (const f of fields) obj[f.key] = f.type === 'boolean' ? false : '';
  return obj;
}

// Flatten the tree in visible order (depth-first, respecting expanded set).
// Used to drive keyboard nav (arrow up/down walk the flat list).
function flattenVisible(childrenByParent, expanded, parentKey = 'root') {
  const kids = childrenByParent.get(parentKey) ?? [];
  const out = [];
  for (const k of kids) {
    out.push(k);
    if (expanded.has(k._id)) {
      out.push(...flattenVisible(childrenByParent, expanded, k._id));
    }
  }
  return out;
}

function TreeView({ category, tree }) {
  const {
    nodes,
    childrenByParent,
    descendantIds,
    selectedId,
    setSelectedId,
    createNode,
    updateNode,
    deleteNode,
    moveNode,
    reorderWithin,
  } = tree;

  const [expanded, setExpanded] = useState(() => new Set());
  const [editingId, setEditingId] = useState(null);
  const [addingChildId, setAddingChildId] = useState(null);
  const [addingRoot, setAddingRoot] = useState(false);
  const [rootValues, setRootValues] = useState(() => emptyValues(category.fields));

  // Live drag state.
  // { draggedId, overId, zone: 'above' | 'inside' | 'below' }
  const [dragState, setDragState] = useState({ draggedId: null, overId: null, zone: null });

  // rowRefs so keyboard nav can .focus() the selected row.
  const rowRefs = useRef(new Map());
  const registerRowRef = useCallback((id, el) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  }, []);

  // Expand root nodes once on first load so the user sees something. This is
  // the legitimate "seed state from an async source" pattern — we only write
  // on first arrival of data, and never again.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (!nodes || nodes.length === 0) return;
    seededRef.current = true;
    const roots = childrenByParent.get('root') ?? [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded(new Set(roots.map((n) => n._id)));
  }, [nodes, childrenByParent]);

  const visibleFlat = useMemo(
    () => flattenVisible(childrenByParent, expanded),
    [childrenByParent, expanded],
  );

  // Focus the selected row whenever selection changes (keyboard nav-friendly).
  useEffect(() => {
    if (!selectedId) return;
    rowRefs.current.get(selectedId)?.focus();
  }, [selectedId]);

  // -------- Expansion -------- //
  const toggle = useCallback((id) => {
    setExpanded((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // -------- Inline editors -------- //
  const startEdit = (id) => {
    setEditingId(id);
    setAddingChildId(null);
  };
  const startAddChild = (id) => {
    setAddingChildId(id);
    setEditingId(null);
    setExpanded((s) => new Set(s).add(id));
  };
  const cancelInline = () => {
    setEditingId(null);
    setAddingChildId(null);
  };

  const submitEdit = async (id, values) => {
    try {
      await updateNode(id, { values });
      setEditingId(null);
    } catch {
      /* toast already shown */
    }
  };
  const submitAddChild = async (parentId, values) => {
    try {
      await createNode({ parentId, values });
      setAddingChildId(null);
    } catch {
      /* toast already shown */
    }
  };

  const handleDelete = async (node) => {
    const descCount = descendantIds(node._id).size;
    const label = describe(node, category);
    const msg =
      descCount > 0
        ? `Delete "${label}" and ${descCount} descendant${descCount === 1 ? '' : 's'}?`
        : `Delete "${label}"?`;
    if (!window.confirm(msg)) return;
    await deleteNode(node._id);
    if (selectedId === node._id) setSelectedId(null);
  };

  // -------- Drag & drop -------- //
  const handleDragStart = (e, id) => {
    setDragState({ draggedId: id, overId: null, zone: null });
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires setData.
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e, overId) => {
    const { draggedId } = dragState;
    if (!draggedId || draggedId === overId) return;
    // Can't drop into own subtree.
    if (descendantIds(draggedId).has(overId)) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;
    let zone;
    if (y < h * 0.25) zone = 'above';
    else if (y > h * 0.75) zone = 'below';
    else zone = 'inside';

    setDragState((s) =>
      s.overId === overId && s.zone === zone ? s : { draggedId, overId, zone },
    );
  };

  const handleDragEnd = () => {
    setDragState({ draggedId: null, overId: null, zone: null });
  };

  const handleDrop = async (e, overId) => {
    e.preventDefault();
    const { draggedId, zone } = dragState;
    setDragState({ draggedId: null, overId: null, zone: null });
    if (!draggedId || draggedId === overId) return;
    if (descendantIds(draggedId).has(overId)) return;

    const dragged = nodes.find((n) => n._id === draggedId);
    const target = nodes.find((n) => n._id === overId);
    if (!dragged || !target) return;

    if (zone === 'inside') {
      // Drop as new last-child of target.
      if (String(dragged.parentId) !== String(target._id)) {
        await moveNode(draggedId, target._id);
        setExpanded((s) => new Set(s).add(target._id));
      }
      return;
    }

    // 'above' or 'below' — drop as sibling of target.
    const newParentId = target.parentId ?? null;
    if (String(dragged.parentId) !== String(newParentId)) {
      // Different parent — move first, then the reorder step will place it.
      await moveNode(draggedId, newParentId);
    }

    // Build new sibling order for that parent.
    const parentKey = newParentId ?? 'root';
    const current = (childrenByParent.get(parentKey) ?? []).map((n) => n._id);
    // Drop the dragged id if it was already in this parent, then re-insert.
    const without = current.filter((id) => id !== draggedId);
    const targetIdx = without.indexOf(overId);
    const insertAt = zone === 'above' ? targetIdx : targetIdx + 1;
    const newOrder = [
      ...without.slice(0, insertAt),
      draggedId,
      ...without.slice(insertAt),
    ];
    if (newOrder.length > 1) {
      await reorderWithin(parentKey, newOrder);
    }
  };

  // -------- Keyboard -------- //
  const handleKeyDown = (e) => {
    if (!selectedId) return;
    const idx = visibleFlat.findIndex((n) => n._id === selectedId);
    if (idx < 0) return;
    const node = visibleFlat[idx];

    const move = (delta) => {
      const next = visibleFlat[idx + delta];
      if (next) setSelectedId(next._id);
    };

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        move(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (!expanded.has(node._id)) toggle(node._id);
        else move(1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (expanded.has(node._id)) toggle(node._id);
        else if (node.parentId) setSelectedId(node.parentId);
        break;
      case 'Enter':
        e.preventDefault();
        if (e.shiftKey) startAddChild(node._id);
        else startEdit(node._id);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        handleDelete(node);
        break;
      case 'Escape':
        cancelInline();
        break;
      default:
        break;
    }
  };

  // -------- Add root -------- //
  const submitAddRoot = async () => {
    try {
      await createNode({ parentId: null, values: rootValues });
      setRootValues(emptyValues(category.fields));
      setAddingRoot(false);
    } catch {
      /* toast */
    }
  };

  const roots = childrenByParent.get('root') ?? [];

  return (
    <div onKeyDown={handleKeyDown}>
      <div className="btn-row" style={{ marginBottom: 12, justifyContent: 'space-between' }}>
        <div className="btn-row">
          {!addingRoot && (
            <button className="primary" onClick={() => setAddingRoot(true)}>
              + Add node
            </button>
          )}
          <span className="muted" style={{ fontSize: 13 }}>
            {nodes?.length ?? 0} node{nodes?.length === 1 ? '' : 's'}
          </span>
        </div>
        <span className="muted" style={{ fontSize: 12 }}>
          ↑/↓ navigate · → expand · ← collapse · Enter edit · Shift+Enter add child · Del delete
        </span>
      </div>

      {addingRoot && (
        <div style={{ marginBottom: 12 }}>
          <NodeValuesEditor
            fields={category.fields}
            values={rootValues}
            onChange={setRootValues}
            onSubmit={submitAddRoot}
            onCancel={() => {
              setAddingRoot(false);
              setRootValues(emptyValues(category.fields));
            }}
            submitLabel="Add node"
          />
        </div>
      )}

      {roots.length === 0 ? (
        <div className="empty">
          No nodes yet. Click <strong>+ Add node</strong> to start.
        </div>
      ) : (
        <div className="tree">
          {roots.map((node) => (
            <TreeNode
              key={node._id}
              node={node}
              depth={0}
              category={category}
              childrenByParent={childrenByParent}
              expanded={expanded}
              selectedId={selectedId}
              editingId={editingId}
              addingChildId={addingChildId}
              dragState={dragState}
              onToggle={toggle}
              onSelect={setSelectedId}
              onStartEdit={startEdit}
              onStartAddChild={startAddChild}
              onCancelInline={cancelInline}
              onSubmitEdit={submitEdit}
              onSubmitAddChild={submitAddChild}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              registerRowRef={registerRowRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Best-effort "what's this node called" for confirm dialogs.
function describe(node, category) {
  const v = node.values ?? {};
  for (const f of category.fields) {
    if (f.type === 'text' && v[f.key]) return String(v[f.key]);
  }
  return node._id.slice(-6);
}

export default TreeView;
