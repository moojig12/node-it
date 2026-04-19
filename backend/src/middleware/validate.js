export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      const err = new Error('ValidationError');
      err.status = 400;
      err.details = result.error.issues;
      return next(err);
    }
    if (result.data.body) req.body = result.data.body;
    next();
  };
}
