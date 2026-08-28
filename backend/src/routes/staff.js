const express = require('express');
const { soloStaff } = require('../lib/staffAuth');
const staffSvc = require('../services/staff');
const misionesSvc = require('../services/misiones');
const sorteosSvc = require('../services/sorteos');
const participantesSvc = require('../services/participantes');

const router = express.Router();

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(soloStaff);

/** Permite al panel validar la clave antes de mostrar nada. */
router.get('/verificar', (_req, res) => {
  res.json({ ok: true });
});

router.get('/cola', wrap(async (_req, res) => {
  const [pendientes, totales] = await Promise.all([
    staffSvc.cola(),
    staffSvc.totales(),
  ]);
  res.json({ pendientes, totales });
}));

router.post('/revisar', wrap(async (req, res) => {
  const { participanteId, missionId, estado, motivo } = req.body || {};
  if (!participanteId || !missionId) {
    return res.status(400).json({ error: 'Falta identificar la evidencia' });
  }

  await misionesSvc.revisar({ participanteId, missionId, estado, motivo });
  const totales = await staffSvc.totales();
  res.json({ ok: true, totales });
}));

router.get('/elegibles', wrap(async (_req, res) => {
  res.json({ elegibles: await staffSvc.elegibles() });
}));

router.get('/buscar', wrap(async (req, res) => {
  res.json({ resultados: await staffSvc.buscar(req.query.q) });
}));

/** Declarar (o deshacer) un premio sorpresa entregado en el momento. */
router.post('/sorpresa', wrap(async (req, res) => {
  const { participanteId, motivo, marcar = true } = req.body || {};
  if (!participanteId) {
    return res.status(400).json({ error: 'Falta identificar a la persona' });
  }
  await participantesSvc.marcarSorpresa(participanteId, { motivo, marcar });
  res.json({ ok: true, totales: await staffSvc.totales() });
}));

/** El resultado guardado, para volver a verlo sin re-sortear. */
router.get('/sorteo', wrap(async (_req, res) => {
  res.json(await sorteosSvc.ultimo());
}));

/** Corre el sorteo. Reemplaza cualquier resultado anterior. */
router.post('/sorteo', wrap(async (req, res) => {
  const cantidad = Number(req.body?.cantidad) || 10;
  const elegibles = await staffSvc.elegibles();
  res.json(await sorteosSvc.ejecutar(elegibles, cantidad));
}));

module.exports = router;
