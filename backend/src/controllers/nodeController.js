import Node from '../models/Node.js';

export async function listNodes(req, res, next) {
  try {
    const filter = {};
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.parentId !== undefined) {
      filter.parentId = req.query.parentId === 'null' ? null : req.query.parentId;
    }
    const nodes = await Node.find(filter).sort({ createdAt: -1 });
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

export async function createNode(req, res, next) {
  try {
    const node = await Node.create(req.body);
    res.status(201).json(node);
  } catch (err) {
    next(err);
  }
}

export async function updateNode(req, res, next) {
  try {
    const node = await Node.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!node) return res.status(404).json({ error: 'Node not found' });
    res.json(node);
  } catch (err) {
    next(err);
  }
}

export async function deleteNode(req, res, next) {
  try {
    const node = await Node.findByIdAndDelete(req.params.id);
    if (!node) return res.status(404).json({ error: 'Node not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
