import { test, before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setupDb, teardownDb, resetDb } from '../helpers/db.js';

// Import AFTER the helper so NODE_ENV=test is set before Express boots.
const { default: request } = await import('supertest');
const { default: app } = await import('../../src/app.js');

describe('GET /api/health', () => {
  before(setupDb);
  after(teardownDb);
  beforeEach(resetDb);

  test('returns 200 + ok status when db is connected', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.db, 'connected');
  });
});
