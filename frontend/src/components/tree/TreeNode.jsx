import { useState } from 'react';
import NodeValuesEditor from './NodeValuesEditor.jsx';

// Format a single node value for display. Keeps the tree row compact.
function formatValue(value, type) {
  if (value == null || value === '') return '—';
  if (type === 'boolean') return value ? 'yes' : 'no';
  if (type === 'currency') {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(Number(value));
    } catch {
      return `$${Number(value).toFixed(2)}`;
    }
  }
  if (type === 'date') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  }
  return String(value);
}

function emptyValues(fields) {
  const obj = {};
  for (const f of fields) obj[f.key] = f.type === 'boolean' ? false : '';
  return obj;
}

function TreeNode({
  node,
  depth,
  category,
  childrenByParent,
  expanded,
  selectedId,
  editingId,
  addingChildId,
  dragState,
  onToggle,
  onSelect,
  onStartEdit,
  onStartAddChild,
  onCancelInline,
  onSubmitEdit,
  onSubmitAddChild,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  registerRowRef,
}) {
  const children = childrenByParent.get(node._id) ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(node._id);
  const isSelected = selectedId === node._id;
  const isEditing = editingId === node._id;
  const isAddingChild = addingChildId === node._id;

  const [editValues, setEditValues] = useState(node.values ?? {});
  const [childValues, setChildValues] = useState(emptyValues(category.fields));

  // Keep local edit buffer in sync when the node (or editing target) changes.
  // Cheap: this component only mounts once per node.
  if (!isEditing && editValues !== node.values) setEditValues(node.values ?? {});

  // Drop-zone styling: only the currently-hovered row gets one of these classes.
  let dropClass = '';
  if (dragState.overId === node._id) {
    if (dragState.zone === 'above') dropClass = 'drop-above';
    else if (dragState.zone === 'below') dropClass = 'drop-below';
    else if (dragState.zone === 'inside') dropClass = 'drop-inside';
  }

  return (
    <div className="tree-node">
      <div
        ref={(el) => registerRowRef(node._id, el)}
        tabIndex={isSelected ? 0 : -1}
        className={`tree-row ${isSelected ? 'selected' : ''} ${dropClass}`}
        style={{ paddingLeft: `calc(var(--space-3) + ${depth} * var(--indent))` }}
        draggable
        onClick={() => onSelect(node._id)}
        onDragStart={(e) => onDragStart(e, node._id)}
        onDragOver={(e) => onDragOver(e, node._id)}
        onDragEnd={onDragEnd}
        onDrop={(e) => onDrop(e, node._id)}
      >
        <button
          type="button"
          className={`tree-toggle ${hasChildren ? '' : 'placeholder'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node._id);
          }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          tabIndex={-1}
        >
          {hasChildren ? (isExpanded ? '▾' : '▸') : '•'}
        </button>

        <div className="tree-values">
          {category.fields.map((field) => (
            <span key={field.key} className="tree-value" title={`${field.label}: ${formatValue(node.values?.[field.key], field.type)}`}>
              <span className="v-label">{field.label}</span>
              <span className="v-val">
                {formatValue(node.values?.[field.key], field.type)}
              </span>
            </span>
          ))}
        </div>

        <div className="tree-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onStartAddChild(node._id)}
            title="Add child (Shift+Enter)"
          >
            + child
          </button>
          <button
            type="button"
            onClick={() => onStartEdit(node._id)}
            title="Edit (Enter)"
          >
            edit
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => onDelete(node)}
            title="Delete (Del)"
          >
            ×
          </button>
        </div>
      </div>

      {isEditing && (
        <div style={{ paddingLeft: `calc(var(--space-3) + ${depth + 1} * var(--indent))` }}>
          <NodeValuesEditor
            fields={category.fields}
            values={editValues}
            onChange={setEditValues}
            onSubmit={() => onSubmitEdit(node._id, editValues)}
            onCancel={onCancelInline}
            submitLabel="Save"
          />
        </div>
      )}

      {isAddingChild && (
        <div style={{ paddingLeft: `calc(var(--space-3) + ${depth + 1} * var(--indent))` }}>
          <NodeValuesEditor
            fields={category.fields}
            values={childValues}
            onChange={setChildValues}
            onSubmit={() => {
              onSubmitAddChild(node._id, childValues);
              setChildValues(emptyValues(category.fields));
            }}
            onCancel={() => {
              onCancelInline();
              setChildValues(emptyValues(category.fields));
            }}
            submitLabel="Add child"
          />
        </div>
      )}

      {isExpanded &&
        children.map((child) => (
          <TreeNode
            key={child._id}
            node={child}
            depth={depth + 1}
            category={category}
            childrenByParent={childrenByParent}
            expanded={expanded}
            selectedId={selectedId}
            editingId={editingId}
            addingChildId={addingChildId}
            dragState={dragState}
            onToggle={onToggle}
            onSelect={onSelect}
            onStartEdit={onStartEdit}
            onStartAddChild={onStartAddChild}
            onCancelInline={onCancelInline}
            onSubmitEdit={onSubmitEdit}
            onSubmitAddChild={onSubmitAddChild}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            registerRowRef={registerRowRef}
          />
        ))}
    </div>
  );
}

export default TreeNode;
