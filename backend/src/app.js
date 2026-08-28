const express = require('express');
const cors = require('cors');
const publicas = require('./routes/publicas');
const staff = require('./routes/staff');
const config = require('./lib/config');

const app = express();

app.use(cors({ origin: true, allowedHeaders: ['Content-Type', 'X-Staff-Key'] }));
app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, stage: config.stage, hora: new Date().toISOString() });
});

app.use('/api/staff', staff);
app.use('/api', publicas);

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Algo falló de nuestro lado. Intenta de nuevo.' : err.message,
  });
});

module.exports = app;
