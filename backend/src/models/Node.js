import mongoose from 'mongoose';

const nodeSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    // null for top-level nodes; otherwise the parent Node this one lives under.
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Node',
      default: null,
      index: true,
    },
    // Denormalised ancestor chain (root → ... → parent). Enables single-query
    // subtree reads/deletes without $graphLookup. Maintained by:
    //   - pre-save hook below (new nodes)
    //   - services/nodeTree.moveNode (parent changes cascade to descendants)
    ancestors: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      index: true,
    },
    // Sibling ordering. Defaults to insertion timestamp so fresh nodes append
    // naturally; reorder UIs overwrite with explicit integers.
    order: {
      type: Number,
      default: () => Date.now(),
      index: true,
    },
    // Values keyed by the parent category's field.key.
    // Shape is category-driven, so Mixed by design.
    values: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // SHA-1 of the values at category.identityKeys — lets duplicate creates
    // collapse into the existing node. Null means "merge disabled for this node".
    // Maintained by the controller via services/nodeIdentity.
    identityHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, minimize: false },
);

// Sibling listing: list sub-nodes of a parent in order, fast.
nodeSchema.index({ parentId: 1, order: 1 });

// Merge-on-duplicate lookup + hard constraint: no two siblings can share
// an identityHash within the same category. Partial: skips null hashes.
nodeSchema.index(
  { categoryId: 1, parentId: 1, identityHash: 1 },
  {
    unique: true,
    partialFilterExpression: { identityHash: { $type: 'string' } },
    name: 'category_parent_identity_unique',
  },
);

// Fill `ancestors` when a node is created. Moves (parentId changes on existing
// nodes) must go through services/nodeTree.moveNode so descendants update too.
// Async / throw style — Mongoose 9 dropped callback-based hooks.
nodeSchema.pre('save', async function preSave() {
  if (!this.isNew) return;
  if (!this.parentId) {
    this.ancestors = [];
    return;
  }
  const parent = await this.constructor
    .findById(this.parentId)
    .select('ancestors')
    .lean();
  if (!parent) {
    const err = new Error(`Parent node ${this.parentId} not found`);
    err.status = 400;
    throw err;
  }
  this.ancestors = [...parent.ancestors, this.parentId];
});

export default mongoose.model('Node', nodeSchema);
