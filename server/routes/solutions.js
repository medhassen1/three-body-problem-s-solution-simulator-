const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// ---------------------------------------------------------------------------
// Phase 1: in-memory mock data using the 8 built-in periodic orbits.
// In Phase 3 every handler below gets replaced with a Prisma DB query.
// ---------------------------------------------------------------------------

const MOCK_SOLUTIONS = [
  {
    id: 'preset-figure8',
    name: 'Figure-8 Orbit',
    description: 'Famous stable periodic orbit discovered by Moore (1993). Three equal masses chase each other along a figure-eight path.',
    isPublic: true,
    b1X: -1, b1Y: 0, b1Vx: 0.347111,          b1Vy: 0.532728,          b1Mass: 1,
    b2X:  1, b2Y: 0, b2Vx: 0.347111,          b2Vy: 0.532728,          b2Mass: 1,
    b3X:  0, b3Y: 0, b3Vx: -2 * 0.347111,     b3Vy: -2 * 0.532728,    b3Mass: 1,
    integrator: 'rk4', timestep: 0.001,
    tags: ['stable', 'periodic', 'classic'],
    likesCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    author: 'system'
  },
  {
    id: 'preset-butterfly1',
    name: 'Butterfly-I Orbit',
    description: 'Šuvakov-Dmitrašinović (2013). Unstable — sensitive to perturbations.',
    isPublic: true,
    b1X: -1, b1Y: 0, b1Vx: 0.306893,          b1Vy: 0.125507,          b1Mass: 1,
    b2X:  1, b2Y: 0, b2Vx: 0.306893,          b2Vy: 0.125507,          b2Mass: 1,
    b3X:  0, b3Y: 0, b3Vx: -2 * 0.306893,     b3Vy: -2 * 0.125507,    b3Mass: 1,
    integrator: 'rk4', timestep: 0.001,
    tags: ['unstable', 'periodic'],
    likesCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    author: 'system'
  },
  {
    id: 'preset-butterfly2',
    name: 'Butterfly-II Orbit',
    description: 'Šuvakov-Dmitrašinović (2013). Stable with 4th body mass 0.001–0.0019.',
    isPublic: true,
    b1X: -1, b1Y: 0, b1Vx: 0.392955,          b1Vy: 0.097579,          b1Mass: 1,
    b2X:  1, b2Y: 0, b2Vx: 0.392955,          b2Vy: 0.097579,          b2Mass: 1,
    b3X:  0, b3Y: 0, b3Vx: -2 * 0.392955,     b3Vy: -2 * 0.097579,    b3Mass: 1,
    integrator: 'rk4', timestep: 0.001,
    tags: ['stable', 'periodic'],
    likesCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    author: 'system'
  },
  {
    id: 'preset-bumblebee',
    name: 'Bumblebee Orbit',
    description: 'Šuvakov-Dmitrašinović (2013). Stable with 4th body mass 0.001–0.0031.',
    isPublic: true,
    b1X: -1, b1Y: 0, b1Vx: 0.184279,          b1Vy: 0.587188,          b1Mass: 1,
    b2X:  1, b2Y: 0, b2Vx: 0.184279,          b2Vy: 0.587188,          b2Mass: 1,
    b3X:  0, b3Y: 0, b3Vx: -2 * 0.184279,     b3Vy: -2 * 0.587188,    b3Mass: 1,
    integrator: 'rk4', timestep: 0.001,
    tags: ['stable', 'periodic'],
    likesCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    author: 'system'
  },
  {
    id: 'preset-dragonfly',
    name: 'Dragonfly Orbit',
    description: 'Šuvakov-Dmitrašinović (2013). Stable with 4th body mass 0.001–0.0021.',
    isPublic: true,
    b1X: -1, b1Y: 0, b1Vx: 0.080584,          b1Vy: 0.588836,          b1Mass: 1,
    b2X:  1, b2Y: 0, b2Vx: 0.080584,          b2Vy: 0.588836,          b2Mass: 1,
    b3X:  0, b3Y: 0, b3Vx: -2 * 0.080584,     b3Vy: -2 * 0.588836,    b3Mass: 1,
    integrator: 'rk4', timestep: 0.001,
    tags: ['stable', 'periodic'],
    likesCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    author: 'system'
  },
  {
    id: 'preset-goggles',
    name: 'Goggles Orbit',
    description: 'Šuvakov-Dmitrašinović (2013). Very unstable — sensitive to perturbations.',
    isPublic: true,
    b1X: -1, b1Y: 0, b1Vx: 0.083300,          b1Vy: 0.127889,          b1Mass: 1,
    b2X:  1, b2Y: 0, b2Vx: 0.083300,          b2Vy: 0.127889,          b2Mass: 1,
    b3X:  0, b3Y: 0, b3Vx: -2 * 0.083300,     b3Vy: -2 * 0.127889,    b3Mass: 1,
    integrator: 'rk4', timestep: 0.001,
    tags: ['unstable', 'periodic'],
    likesCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    author: 'system'
  },
  {
    id: 'preset-moth1',
    name: 'Moth-I Orbit',
    description: 'Šuvakov-Dmitrašinović (2013). Stable with 4th body mass 0.001–0.0041.',
    isPublic: true,
    b1X: -1, b1Y: 0, b1Vx: 0.464445,          b1Vy: 0.396060,          b1Mass: 1,
    b2X:  1, b2Y: 0, b2Vx: 0.464445,          b2Vy: 0.396060,          b2Mass: 1,
    b3X:  0, b3Y: 0, b3Vx: -2 * 0.464445,     b3Vy: -2 * 0.396060,    b3Mass: 1,
    integrator: 'rk4', timestep: 0.001,
    tags: ['stable', 'periodic'],
    likesCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    author: 'system'
  },
  {
    id: 'preset-moth2',
    name: 'Moth-II Orbit',
    description: 'Šuvakov-Dmitrašinović (2013). Very unstable — stable only at masses 0.0011–0.0012.',
    isPublic: true,
    b1X: -1, b1Y: 0, b1Vx: 0.439166,          b1Vy: 0.452968,          b1Mass: 1,
    b2X:  1, b2Y: 0, b2Vx: 0.439166,          b2Vy: 0.452968,          b2Mass: 1,
    b3X:  0, b3Y: 0, b3Vx: -2 * 0.439166,     b3Vy: -2 * 0.452968,    b3Mass: 1,
    integrator: 'rk4', timestep: 0.001,
    tags: ['unstable', 'periodic'],
    likesCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    author: 'system'
  }
];

// ---------------------------------------------------------------------------
// GET /api/solutions
// Public gallery — paginated, with optional tag filter
// Query params: page (default 1), limit (default 10), tag
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const tag   = req.query.tag;

  let results = MOCK_SOLUTIONS;
  if (tag) {
    results = results.filter(s => s.tags.includes(tag));
  }

  const total      = results.length;
  const totalPages = Math.ceil(total / limit);
  const data       = results.slice((page - 1) * limit, page * limit);

  res.json({ data, total, page, totalPages });
});

// ---------------------------------------------------------------------------
// GET /api/solutions/:id
// Single solution by ID
// ---------------------------------------------------------------------------
router.get('/:id', (req, res) => {
  const solution = MOCK_SOLUTIONS.find(s => s.id === req.params.id);
  if (!solution) {
    return res.status(404).json({ error: 'Solution not found' });
  }
  res.json(solution);
});

// ---------------------------------------------------------------------------
// POST /api/solutions
// Create a new solution — auth wired up, DB query coming in Phase 3
// ---------------------------------------------------------------------------
router.post('/', authMiddleware, (req, res) => {
  res.status(501).json({ error: 'Saving solutions coming in Phase 3' });
});

// ---------------------------------------------------------------------------
// PUT /api/solutions/:id
// Update a solution — auth + ownership check coming in Phase 3
// ---------------------------------------------------------------------------
router.put('/:id', authMiddleware, (req, res) => {
  res.status(501).json({ error: 'Updating solutions coming in Phase 3' });
});

// ---------------------------------------------------------------------------
// DELETE /api/solutions/:id
// Delete a solution — auth + ownership check coming in Phase 3
// ---------------------------------------------------------------------------
router.delete('/:id', authMiddleware, (req, res) => {
  res.status(501).json({ error: 'Deleting solutions coming in Phase 3' });
});

// ---------------------------------------------------------------------------
// POST /api/solutions/:id/like
// Toggle like — auth wired up, DB query coming in Phase 3
// ---------------------------------------------------------------------------
router.post('/:id/like', authMiddleware, (req, res) => {
  res.status(501).json({ error: 'Likes coming in Phase 3' });
});

module.exports = router;
