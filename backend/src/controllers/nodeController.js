import Node from '../models/Node.js';
import Category from '../models/Category.js';
import { computeIdentityHash } from '../services/nodeIdentity.js';
import { applyMergeValues } from '../services/nodeMerge.js';
import { moveNode, loadSubtree, deleteSubtree } from '../services/nodeTree.js';
import { aggregateSubtree } from '../services/nodeAggregate.js';

export async function listNodes(req, res, next) {
  try {
    const filter = {};
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.parentId !== undefined) {
      filter.parentId = req.query.parentId === 'null' ? null : req.query.parentId;
    }
    // Sort by explicit order so drag-and-drop reorders survive round-trips.
    const nodes = await Node.find(filter).sort({ order: 1 });
    res.json(nodes);
  } catch (err) {
    next(err);
  }
}

export async function getNode(req, res, next) {
  try {
    const node = await Node.findById(req.params.id);
    if (!node) return res.status(404).json({ error: 'Node not found' });
    res.json(node);
  } catch (err) {
    next(err);
  }
}

export async function getNodeSubtree(req, res, next) {
  try {
    const tree = await loadSubtree(req.params.id);
    if (!tree) return res.status(404).json({ error: 'Node not found' });
    res.json(tree);
  } catch (err) {
    next(err);
  }
}

export async function getNodeAggregate(req, res, next) {
  try {
    const result = await aggregateSubtree(req.params.id);
    if (!result) return res.status(404).json({ error: 'Node not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Create a node. If the category defines identityKeys and a sibling with a
 * matching identityHash already exists, merge into it (sum-aggregated fields
 * combine, others keep their original value) instead of creating a duplicate.
 */
export async function createNode(req, res, next) {
  try {
    const { categoryId, parentId = null, values = {} } = req.body;

    const category = await Category.findById(categoryId).lean();
    if (!category) return res.status(400).json({ error: 'Category not found' });

    const identityHash = computeIdentityHash(category, values);

    if (identityHash) {
      const existing = await Node.findOne({ categoryId, parentId, identityHash });
      if (existing) {
        existing.values = applyMergeValues(category, existing.values, values);
        existing.markModified('values');
        await existing.save();
        return res.json(existing);
      }
    }

    const node = await Node.create({ categoryId, parentId, values, identityHash });
    res.status(201).json(node);
  } catch (err) {
    next(err);
  }
}

/**
 * Patch a node's values and/or reparent it. Reparenting uses the tree service
 * so descendant ancestor chains stay consistent.
 */
export async function updateNode(req, res, next) {
  try {
    const { parentId, values } = req.body;
    let node = await Node.findById(req.params.id);
    if (!node) return res.status(404).json({ error: 'Node not found' });

    const wantsMove =
      parentId !== undefined && String(parentId) !== String(node.parentId);
    if (wantsMove) {
      await moveNode(node._id, parentId ?? null);
      // moveNode updated the doc + descendants; reload to pick up new ancestors.
      node = await Node.findById(node._id);
    }

    if (values !== undefined) {
      const category = await Category.findById(node.categoryId).lean();
      node.values = values;
      node.identityHash = computeIdentityHash(category, values);
      node.markModified('values');
      await node.save();
    }

    res.json(node);
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk-set `order` on a list of sibling nodes. Expects body `{ nodeIds: [...] }`
 * in the intended new order; writes evenly-spaced integer orders so subsequent
 * single-node moves can slot between without a full re-renumber.
 *
 * All nodes must share the same parentId (and categoryId) — drag-and-drop
 * within a single parent list. Cross-parent moves go through PATCH /:id.
 */
export async function reorderNodes(req, res, next) {
  try {
    const { nodeIds } = req.body;
    if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
      return res.status(400).json({ error: 'nodeIds must be a non-empty array' });
    }

    const nodes = await Node.find({ _id: { $in: nodeIds } });
    if (nodes.length !== nodeIds.length) {
      return res.status(400).json({ error: 'One or more node IDs not found' });
    }

    const parentIds = new Set(nodes.map((n) => String(n.parentId)));
    if (parentIds.size > 1) {
      return res
        .status(400)
        .json({ error: 'All nodes must share the same parent' });
    }

    // 1000-step gap leaves room for future "insert between" operations
    // without renumbering on every drag.
    const STEP = 1000;
    await Promise.all(
      nodeIds.map((id, idx) =>
        Node.updateOne({ _id: id }, { $set: { order: (idx + 1) * STEP } }),
      ),
    );

    const parentId = nodes[0].parentId;
    const updated = await Node.find({
      _id: { $in: nodeIds },
    }).sort({ order: 1 });
    res.json({ parentId, nodes: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * Hard-delete a node and its entire subtree in one query.
 */
export async function deleteNode(req, res, next) {
  try {
    const node = await Node.findById(req.params.id);
    if (!node) return res.status(404).json({ error: 'Node not found' });
    await deleteSubtree(node._id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
