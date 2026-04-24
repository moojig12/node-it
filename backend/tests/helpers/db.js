// Shared in-memory Mongo instance used by every integration test.
// Each test file calls setupDb/teardownDb in before/after hooks, and
// resetDb() in beforeEach to get a clean slate without paying the
// MongoMemoryServer startup cost per test.

process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo;

export async function setupDb() {
  if (mongo) return;
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  // Ensure all indexes (including the partial unique on identityHash) are
  // built before tests run — otherwise duplicate-key tests become flaky.
  await Promise.all(
    Object.values(mongoose.models).map((m) => m.syncIndexes()),
  );
}

export async function teardownDb() {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
    mongo = null;
  }
}

export async function resetDb() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({})),
  );
}
