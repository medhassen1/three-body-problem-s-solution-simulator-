// JWT verification middleware — wired up in Phase 2
// Placed here now so routes can import it without changes later

const authMiddleware = (req, res, next) => {
  res.status(501).json({ error: 'Authentication not yet implemented — coming in Phase 2' });
};

module.exports = authMiddleware;
