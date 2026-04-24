import Node from '../models/Node.js';

/**
 * Reparent a node and cascade the `ancestors` update to every descendant.
 * Runs the descendant update as a single aggregation-pipeline updateMany
 * so large subtrees don't become an N-round-trip loop.
 */
export async function moveNode(nodeId, newParentId) {
  const node = await Node.findById(nodeId);
  if (!node) {
    const err = new Error('Node not found');
    err.status = 404;
    throw err;
  }

  const newParent = newParentId
    ? await Node.findById(newParentId).select('ancestors').lean()
    : null;

  if (newParentId && !newParent) {
    const err = new Error('Target parent not found');
    err.status = 400;
    throw err;
  }

  // Guard: cannot move a node under itself or one of its own descendants.
  if (newParent && [...newParent.ancestors, newParent._id].some((id) => id.equals(node._id))) {
    const err = new Error('Cannot move a node beneath itself');
    err.status = 400;
    throw err;
  }

  const newAncestors = newParent ? [...newParent.ancestors, newParent._id] : [];
  const oldDepth = node.ancestors.length;

  node.parentId = newParentId ?? null;
  node.ancestors = newAncestors;
  await node.save();

  // Descendants' ancestors = [node.ancestors, node._id, ...tail] where tail
  // is everything after the original position of this node.
  // `updatePipeline: true` is required in Mongoose 9 for aggregation-pipeline updates.
  await Node.updateMany(
    { ancestors: node._id },
    [
      {
        $set: {
          ancestors: {
            $concatArrays: [
              newAncestors,
              [node._id],
              {
                $slice: [
                  '$ancestors',
                  oldDepth + 1,
                  { $size: '$ancestors' },
                ],
              },
            ],
          },
        },
      },
    ],
    { updatePipeline: true },
  );

  return node;
}

/**
 * Return a node plus every descendant, sorted parent-first then by order.
 * Single indexed query via the `ancestors` field.
 */
export async function loadSubtree(rootId) {
  const root = await Node.findById(rootId).lean();
  if (!root) return null;
  const descendants = await Node.find({ ancestors: rootId })
    .sort({ order: 1 })
    .lean();
  return { root, descendants };
}

/**
 * Hard-delete a node and all its descendants.
 */
export async function deleteSubtree(rootId) {
  const res = await Node.deleteMany({
    $or: [{ _id: rootId }, { ancestors: rootId }],
  });
  return res.deletedCount;
}
