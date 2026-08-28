const { createHash, randomBytes } = require('crypto');

/**
 * Generador pseudoaleatorio determinista a partir de una semilla.
 * Se usa para que el sorteo sea reproducible: guardando la semilla,
 * cualquiera puede recalcular el mismo resultado y comprobar que no
 * se manipulo.
 */
function generador(semilla) {
  let estado = createHash('sha256').update(String(semilla)).digest();
  let indice = 0;

  return function siguiente() {
    if (indice + 4 > estado.length) {
      estado = createHash('sha256').update(estado).digest();
      indice = 0;
    }
    const valor = estado.readUInt32BE(indice);
    indice += 4;
    return valor / 0x100000000;
  };
}

/**
 * Sortea `cantidad` ganadores entre los elegibles.
 *
 * Cada persona entra a la tombola tantas veces como entradas tenga
 * (1 por cumplir las obligatorias, +1 por cada bonus aprobado), asi que
 * los bonus aumentan la probabilidad. Pero al salir sorteada se retiran
 * TODAS sus entradas restantes: nadie puede ganar dos premios.
 */
function sortear(elegibles, cantidad, semillaDada) {
  const semilla = semillaDada || randomBytes(16).toString('hex');
  const aleatorio = generador(semilla);

  // La tombola: una entrada por cada oportunidad.
  let tombola = [];
  for (const persona of elegibles) {
    for (let i = 0; i < persona.entradas; i += 1) {
      tombola.push(persona);
    }
  }

  const ganadores = [];
  const cupos = Math.min(cantidad, elegibles.length);

  while (ganadores.length < cupos && tombola.length > 0) {
    const elegido = tombola[Math.floor(aleatorio() * tombola.length)];
    ganadores.push(elegido);
    // Se va con todas sus entradas: un premio por persona.
    tombola = tombola.filter((p) => p.id !== elegido.id);
  }

  return {
    ganadores,
    semilla,
    sorteadoEn: new Date().toISOString(),
    totalElegibles: elegibles.length,
    totalEntradas: elegibles.reduce((suma, p) => suma + p.entradas, 0),
  };
}

module.exports = { sortear, generador };
