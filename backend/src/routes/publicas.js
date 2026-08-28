const express = require('express');
const participantes = require('../services/participantes');
const misiones = require('../services/misiones');
const { urlDeSubida } = require('../lib/s3');
const { esMisionValida } = require('../lib/misiones');
const { calcularEstado } = require('../lib/misiones');
const { soloAntesDelCierre, config } = require('../lib/evento');

const router = express.Router();

/** Envuelve un handler async para que los errores lleguen al middleware. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Fecha de cierre y premios: la app los lee de aca, no los tiene quemados. */
router.get('/config', (_req, res) => {
  res.json(config());
});

router.post('/participantes', soloAntesDelCierre, wrap(async (req, res) => {
  const { nombre, celular } = req.body || {};
  const { participante, nuevo } = await participantes.registrar(nombre, celular);
  const lista = nuevo ? [] : await misiones.porParticipante(participante.id);
  res.status(nuevo ? 201 : 200).json(participantes.componer(participante, lista));
}));

router.get('/participantes/:id', wrap(async (req, res) => {
  const participante = await participantes.porId(req.params.id);
  if (!participante) {
    return res.status(404).json({ error: 'No encontramos tu registro' });
  }
  const lista = await misiones.porParticipante(participante.id);
  res.json(participantes.componer(participante, lista));
}));

router.post('/uploads/presign', soloAntesDelCierre, wrap(async (req, res) => {
  const { participanteId, missionId, contentType } = req.body || {};

  const participante = await participantes.porId(participanteId);
  if (!participante) {
    return res.status(404).json({ error: 'No encontramos tu registro' });
  }
  if (!esMisionValida(missionId)) {
    return res.status(400).json({ error: 'Mision desconocida' });
  }

  const key = `${participanteId}/${missionId}-${Date.now()}`;
  const uploadUrl = await urlDeSubida(key, contentType);
  res.json({ uploadUrl, key });
}));

router.post('/misiones', soloAntesDelCierre, wrap(async (req, res) => {
  const { participanteId, missionId, fotoKey, data } = req.body || {};

  const participante = await participantes.porId(participanteId);
  if (!participante) {
    return res.status(404).json({ error: 'No encontramos tu registro' });
  }
  // La foto tiene que pertenecer a esta persona: la key la generamos nosotros.
  if (!String(fotoKey || '').startsWith(`${participanteId}/`)) {
    return res.status(400).json({ error: 'La foto no corresponde a tu registro' });
  }

  await misiones.enviar({ participanteId, missionId, fotoKey, data });
  const lista = await misiones.porParticipante(participanteId);
  res.status(201).json(participantes.componer(participante, lista));
}));

/** Contador social que se muestra en la app. */
router.get('/stats', wrap(async (_req, res) => {
  const [total, todas] = await Promise.all([
    participantes.contar(),
    misiones.listarTodas(),
  ]);

  const porPersona = new Map();
  for (const m of todas) {
    if (!porPersona.has(m.participanteId)) porPersona.set(m.participanteId, []);
    porPersona.get(m.participanteId).push(m);
  }

  let elegibles = 0;
  for (const lista of porPersona.values()) {
    if (calcularEstado(lista).elegible) elegibles += 1;
  }

  res.json({ participantes: total, elegibles });
}));

module.exports = router;
