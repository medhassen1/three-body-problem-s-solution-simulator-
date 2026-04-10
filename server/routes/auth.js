const express = require('express');
const router = express.Router();

// Stubs — fully implemented in Phase 2

// POST /api/auth/register
router.post('/register', (req, res) => {
  res.status(501).json({ error: 'Not yet implemented — coming in Phase 2' });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.status(501).json({ error: 'Not yet implemented — coming in Phase 2' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  res.status(501).json({ error: 'Not yet implemented — coming in Phase 2' });
});

module.exports = router;
