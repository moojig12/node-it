import Node from '../models/Node.js';
import Category from '../models/Category.js';

/**
 * Roll up a node's subtree (root + descendants, same category) according to
 * the category's per-field `aggregate` config.
 *
 * Runs as a single aggregation pipeline in Mongo — no N+1, no loading the
 * nodes into Node.js memory. Indexed by `_id` and `ancestors`.
 *
 * Returns null if the root or its category is missing.
 *
 * Example response:
 *   {
 *     rootId, categoryId,
 *     nodeCount: 4,
 *     aggregates: {
 *       amount: { strategy: 'sum', value: 150, nodeCount: 4 },
 *       rating: { strategy: 'avg', value: 4.2, nodeCount: 4 }
 *     }
 *   }
 */
export async function aggregateSubtree(rootId) {
  const root = await Node.findById(rootId).lean();
  if (!root) return null;

  const category = await Category.findById(root.categoryId).lean();
  if (!category) return null;

  const aggFields = (category.fields ?? []).filter((f) => f.aggregate);

  // Pull just the node count when nothing to aggregate — still useful.
  const matchStage = {
    $match: {
      categoryId: root.categoryId,
      $or: [{ _id: root._id }, { ancestors: root._id }],
    },
  };

  if (aggFields.length === 0) {
    const nodeCount = await Node.countDocuments(matchStage.$match);
    return {
      rootId: root._id,
      categoryId: root.categoryId,
      nodeCount,
      aggregates: {},
    };
  }

  const groupStage = { _id: null, _nodeCount: { $sum: 1 } };
  for (const field of aggFields) {
    const path = `$values.${field.key}`;
    if (field.aggregate === 'sum') {
      groupStage[field.key] = {
        $sum: { $convert: { input: path, to: 'double', onError: 0, onNull: 0 } },
      };
    } else if (field.aggregate === 'avg') {
      groupStage[field.key] = {
        $avg: { $convert: { input: path, to: 'double', onError: null, onNull: null } },
      };
    } else if (field.aggregate === 'count') {
      // Count non-null / non-empty occurrences of the field.
      groupStage[field.key] = {
        $sum: {
          $cond: [
            { $in: [{ $ifNull: [path, null] }, [null, '']] },
            0,
            1,
          ],
        },
      };
    }
  }

  const [result] = await Node.aggregate([matchStage, { $group: groupStage }]);

  const aggregates = {};
  for (const field of aggFields) {
    aggregates[field.key] = {
      strategy: field.aggregate,
      value: result?.[field.key] ?? (field.aggregate === 'avg' ? null : 0),
      nodeCount: result?._nodeCount ?? 0,
    };
  }

  return {
    rootId: root._id,
    categoryId: root.categoryId,
    nodeCount: result?._nodeCount ?? 0,
    aggregates,
  };
}
