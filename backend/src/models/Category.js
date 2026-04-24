import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'number', 'currency', 'date', 'boolean'],
      required: true,
    },
    // When set, matching-node values in this field are combined
    // (see README: "adding notes with the same name adds up configured value fields").
    // 'sum' is the only strategy applied at write-time (merge-on-duplicate);
    // 'avg' / 'count' are for read-time subtree totals.
    aggregate: {
      type: String,
      enum: ['sum', 'avg', 'count', null],
      default: null,
    },
  },
  { _id: false },
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    fields: { type: [fieldSchema], default: [] },
    // Field keys whose combined values define "same node" for merge-on-duplicate.
    // e.g. ["name"] → creating two nodes with the same name merges them.
    // Empty array disables merging (every create is a new node).
    identityKeys: { type: [String], default: [] },
  },
  { timestamps: true },
);

// Keep identityKeys in sync with defined fields.
// Async / throw style — Mongoose 9 dropped callback-based hooks.
categorySchema.pre('validate', async function () {
  if (!this.identityKeys?.length) return;
  const fieldKeys = new Set(this.fields.map((f) => f.key));
  const bad = this.identityKeys.filter((k) => !fieldKeys.has(k));
  if (bad.length) {
    const err = new Error(
      `identityKeys reference unknown fields: ${bad.join(', ')}`,
    );
    err.status = 400;
    throw err;
  }
});

export default mongoose.model('Category', categorySchema);
