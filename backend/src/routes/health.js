import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Mongoose connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting.
const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

router.get('/', (_req, res) => {
  const readyState = mongoose.connection.readyState;
  const dbOk = readyState === 1;
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: READY_STATES[readyState] ?? 'unknown',
  });
});

export default router;
