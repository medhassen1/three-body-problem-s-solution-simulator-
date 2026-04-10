require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const solutionsRouter = require('./routes/solutions');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve the static frontend from the project root
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api/solutions', solutionsRouter);
app.use('/api/auth', authRouter);

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
