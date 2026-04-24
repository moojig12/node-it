/**
 * Central error handler. Translates common driver/mongoose errors into
 * friendly HTTP responses so controllers can just `next(err)` without
 * boilerplate. Anything unrecognised falls through as 500.
 */
export function errorHandler(err, _req, res, _next) {
  // Mongoose CastError: invalid ObjectId, bad enum value, etc.
  if (err?.name === 'CastError') {
    return res.status(400).json({
      error: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Mongoose schema validation failure.
  if (err?.name === 'ValidationError') {
    const details = Object.values(err.errors ?? {}).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    return res.status(400).json({ error: err.message, details });
  }

  // Driver-level duplicate key (our partial unique index on identityHash).
  if (err?.code === 11000) {
    return res.status(409).json({
      error:
        'Duplicate identity: a node with matching identity fields already exists at this level',
      details: err.keyValue,
    });
  }

  const status = err.status || 500;
  const payload = { error: err.message || 'Internal Server Error' };
  if (err.details) payload.details = err.details;
  if (status >= 500) console.error(err);
  res.status(status).json(payload);
}
