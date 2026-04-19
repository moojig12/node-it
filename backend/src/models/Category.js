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
  },
  { timestamps: true },
);

export default mongoose.model('Category', categorySchema);
