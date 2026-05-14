// ============================================================
// Agradut Foundation — Express Server (Main Entry Point)
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ── Middleware ────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: true, // Allow all origins to prevent CORS blocks on Vercel subdomains
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────
app.use('/api/members',       require('./routes/members'));
app.use('/api/programs',      require('./routes/programs'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/donations',     require('./routes/donations'));
app.use('/api/certificates',  require('./routes/certificates'));
app.use('/api/services',      require('./routes/services'));
app.use('/api/auth',          require('./routes/auth'));

// ── 404 handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`✅ Agradut API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
