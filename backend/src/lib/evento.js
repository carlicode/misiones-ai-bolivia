/**
 * Configuracion del evento.
 *
 * La fecha de cierre vive aca y no en el frontend, por dos razones: se puede
 * cambiar sin volver a compilar la app (basta una variable de entorno), y
 * sobre todo el cierre se aplica de verdad. Un contador que solo se muestra
 * en pantalla no impide que alguien mande evidencias a las 16:30.
 *
 * Si CIERRE_ISO no esta configurada, no se cierra nada: es preferible aceptar
 * evidencias de mas a rechazarlas por una fecha inventada.
 */

function fechaDeCierre() {
  const crudo = process.env.CIERRE_ISO;
  if (!crudo) return null;

  const fecha = new Date(crudo);
  if (Number.isNaN(fecha.getTime())) {
    console.error(`CIERRE_ISO no es una fecha valida: ${crudo}`);
    return null;
  }
  return fecha;
}

function estaCerrado() {
  const cierre = fechaDeCierre();
  return cierre ? Date.now() > cierre.getTime() : false;
}

/** Middleware para las rutas que dejan de aceptar datos tras el cierre. */
function soloAntesDelCierre(_req, res, next) {
  if (estaCerrado()) {
    return res.status(403).json({
      error: 'La participación ya cerró. Los ganadores se anuncian en el grupo de WhatsApp.',
    });
  }
  next();
}

/** Lo que la app necesita saber para pintar el contador. */
function config() {
  const cierre = fechaDeCierre();
  return {
    cierre: cierre ? cierre.toISOString() : null,
    cerrado: estaCerrado(),
    premios: Number(process.env.PREMIOS) || 10,
    anuncio: process.env.HORA_ANUNCIO || '16:00',
  };
}

module.exports = { fechaDeCierre, estaCerrado, soloAntesDelCierre, config };
