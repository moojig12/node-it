import { useCallback, useEffect, useMemo, useState } from 'react';
import { Nodes, readApiError } from '../services/api.js';
import { useToasts } from './useToasts.js';

/**
 * Owns tree state for a single category:
 *   - nodes: flat list, sorted by `order`
 *   - childrenByParent: Map<parentId|'root', Node[]>
 *   - CRUD / move / reorder actions that update optimistically and toast on error
 *
 * Consumers still manage their own UI state (selection, expanded, editing).
 */
export function useTree(categoryId) {
  const [nodes, setNodes] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const toasts = useToasts();

  const refresh = useCallback(async () => {
    try {
      const list = await Nodes.list({ categoryId });
      setNodes(list);
      setLoadError(null);
    } catch (err) {
      setLoadError(readApiError(err, 'Failed to load nodes'));
    }
  }, [categoryId]);

  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    Nodes.list({ categoryId })
      .then((list) => {
        if (!cancelled) {
          setNodes(list);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(readApiError(err, 'Failed to load nodes'));
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const childrenByParent = useMemo(() => {
    const map = new Map();
    if (!nodes) return map;
    // Pre-sort by order so rendering is deterministic.
    const sorted = [...nodes].sort((a, b) => a.order - b.order);
    for (const n of sorted) {
      const key = n.parentId ?? 'root';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(n);
    }
    return map;
  }, [nodes]);

  const nodeById = useMemo(() => {
    const map = new Map();
    for (const n of nodes ?? []) map.set(n._id, n);
    return map;
  }, [nodes]);

  // Walk down from `rootId`, returning every descendant _id. Used to block
  // drop targets inside the dragged node's own subtree.
  const descendantIds = useCallback(
    (rootId) => {
      const out = new Set();
      const walk = (id) => {
        const kids = childrenByParent.get(id) ?? [];
        for (const k of kids) {
          out.add(k._id);
          walk(k._id);
        }
      };
      walk(rootId);
      return out;
    },
    [childrenByParent],
  );

  // -------- Mutations -------- //

  const createNode = async ({ parentId = null, values }) => {
    try {
      const res = await Nodes.createRaw({ categoryId, parentId, values });
      if (res.status === 200) {
        toasts.merge(`Merged into existing "${summary(values)}"`);
      } else {
        toasts.success('Node added');
      }
      await refresh();
      return res.data;
    } catch (err) {
      toasts.error(readApiError(err, 'Could not create node'));
      throw err;
    }
  };

  const updateNode = async (id, patch) => {
    try {
      const updated = await Nodes.update(id, patch);
      await refresh();
      return updated;
    } catch (err) {
      if (err.response?.status === 409) {
        toasts.error('Those values collide with an existing sibling.');
      } else {
        toasts.error(readApiError(err, 'Update failed'));
      }
      throw err;
    }
  };

  const deleteNode = async (id) => {
    try {
      await Nodes.remove(id);
      toasts.success('Node deleted');
      await refresh();
    } catch (err) {
      toasts.error(readApiError(err, 'Delete failed'));
    }
  };

  const moveNode = async (id, newParentId) => {
    try {
      await Nodes.update(id, { parentId: newParentId });
      await refresh();
    } catch (err) {
      toasts.error(readApiError(err, 'Move failed'));
    }
  };

  // Reorder `nodeId` within its parent so it lands at `targetIndex` among siblings.
  const reorderWithin = async (parentKey, nodeIds) => {
    try {
      await Nodes.reorder(nodeIds);
      await refresh();
    } catch (err) {
      toasts.error(readApiError(err, 'Reorder failed'));
    }
  };

  return {
    nodes,
    loadError,
    refresh,
    childrenByParent,
    nodeById,
    descendantIds,
    selectedId,
    setSelectedId,
    createNode,
    updateNode,
    deleteNode,
    moveNode,
    reorderWithin,
  };
}

// Plucks whichever value feels like the node's "name" for toast text.
function summary(values) {
  const v = values ?? {};
  return (
    v.name ??
    v.title ??
    v.label ??
    Object.values(v).find((x) => typeof x === 'string') ??
    'node'
  );
}
