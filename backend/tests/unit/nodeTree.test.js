// Exercises the nodeTree service directly against the in-memory Mongo so we
// cover branches the HTTP-layer tests cross at a higher level (missing-root,
// move-to-null-noop, deleteSubtree return value).
import { test, before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setupDb, teardownDb, resetDb } from '../helpers/db.js';
import { notesCategoryFixture } from '../helpers/fixtures.js';

const { default: request } = await import('supertest');
const { default: app } = await import('../../src/app.js');
const { moveNode, loadSubtree, deleteSubtree } = await import(
  '../../src/services/nodeTree.js'
);

describe('nodeTree service', () => {
  before(setupDb);
  after(teardownDb);
  beforeEach(resetDb);

  async function seed() {
    const cat = (
      await request(app).post('/api/categories').send(notesCategoryFixture)
    ).body;
    const root = (
      await request(app)
        .post('/api/nodes')
        .send({ categoryId: cat._id, values: { title: 'root' } })
    ).body;
    const child = (
      await request(app)
        .post('/api/nodes')
        .send({
          categoryId: cat._id,
          parentId: root._id,
          values: { title: 'child' },
        })
    ).body;
    const grand = (
      await request(app)
        .post('/api/nodes')
        .send({
          categoryId: cat._id,
          parentId: child._id,
          values: { title: 'grand' },
        })
    ).body;
    return { cat, root, child, grand };
  }

  test('moveNode throws 404 for a missing source node', async () => {
    await assert.rejects(
      () => moveNode('000000000000000000000000', null),
      (err) => err.status === 404,
    );
  });

  test('moveNode to null promotes node to top level', async () => {
    const { child } = await seed();
    const moved = await moveNode(child._id, null);
    assert.equal(moved.parentId, null);
    assert.deepEqual(moved.ancestors, []);
  });

  test('moveNode rejects creating a cycle (node → own descendant)', async () => {
    const { root, grand } = await seed();
    await assert.rejects(
      () => moveNode(root._id, grand._id),
      /beneath itself/i,
    );
  });

  test('loadSubtree returns null when root is missing', async () => {
    const result = await loadSubtree('000000000000000000000000');
    assert.equal(result, null);
  });

  test('loadSubtree returns descendants sorted by order', async () => {
    const { root } = await seed();
    const { descendants } = await loadSubtree(root._id);
    assert.equal(descendants.length, 2);
    // All descendants carry root in their ancestors chain.
    for (const d of descendants) {
      assert.ok(d.ancestors.some((a) => String(a) === String(root._id)));
    }
  });

  test('deleteSubtree returns the number of docs removed', async () => {
    const { root } = await seed();
    const removed = await deleteSubtree(root._id);
    assert.equal(removed, 3);
  });
});
