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
    // Values keyed by the parent category's field.key.
    // Shape is category-driven, so Mixed by design.
    values: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

export default mongoose.model('Node', nodeSchema);
