const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const users = require('../store/users');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';
const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function issueToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function safeUser(user) {
  // Never send passwordHash to the client
  const { passwordHash, ...safe } = user;
  return safe;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // --- Validate input ---
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'email, username, and password are required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, _ and -' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // --- Check uniqueness ---
    if (users.find(u => u.email === email.toLowerCase())) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (users.find(u => u.username === username.toLowerCase())) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // --- Create user ---
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString()
    };
    users.push(user);

    const token = issueToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) {
      // Consistent timing — don't reveal whether email exists
      await bcrypt.hash(password, BCRYPT_ROUNDS);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = issueToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me  (protected)
// ---------------------------------------------------------------------------
router.get('/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(safeUser(user));
});

module.exports = router;
