export function requireAuth(req, res, next) {
  if (!req.session?.memberId) {
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'Please sign in with a TU account.' },
    });
  }

  return next();
}
