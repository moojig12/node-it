import Category from '../models/Category.js';
import Node from '../models/Node.js';

export async function listCategories(_req, res, next) {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function getCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    next(err);
  }
}

/**
 * Block deletion while any node still references the category. This avoids
 * orphan nodes with a dangling categoryId. Callers can pass `?force=true`
 * to cascade-delete all nodes of this category in a single query.
 */
export async function deleteCategory(req, res, next) {
  try {
    const force = req.query.force === 'true';
    const referencing = await Node.countDocuments({ categoryId: req.params.id });

    if (referencing > 0 && !force) {
      return res.status(409).json({
        error: `Category has ${referencing} node(s). Delete them first, or pass ?force=true to cascade.`,
      });
    }

    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Category not found' });

    if (force && referencing > 0) {
      await Node.deleteMany({ categoryId: req.params.id });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
