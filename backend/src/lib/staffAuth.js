const { timingSafeEqual } = require('crypto');
const config = require('./config');

/** Compara sin filtrar informacion por el tiempo de respuesta. */
function clavesIguales(recibida, esperada) {
  const a = Buffer.from(String(recibida || ''), 'utf8');
  const b = Buffer.from(String(esperada || ''), 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Protege las rutas del panel. La clave viaja en el header X-Staff-Key. */
function soloStaff(req, res, next) {
  if (!clavesIguales(req.get('X-Staff-Key'), config.staffKey)) {
    return res.status(401).json({ error: 'Clave incorrecta' });
  }
  next();
}

module.exports = { soloStaff };
