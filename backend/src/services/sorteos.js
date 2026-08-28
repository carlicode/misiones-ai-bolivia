const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const db = require('../lib/db');
const config = require('../lib/config');
const { sortear } = require('../lib/sorteo');

/**
 * Solo guardamos el ultimo sorteo, bajo una clave fija. Si se vuelve a
 * sortear, se reemplaza: el resultado valido es siempre el ultimo.
 */
const CLAVE = 'ULTIMO';

async function ultimo() {
  const { Item } = await db.send(new GetCommand({
    TableName: config.tablaSorteos,
    Key: { id: CLAVE },
  }));
  return Item || null;
}

async function ejecutar(elegibles, cantidad) {
  // Quien ya gano un premio sorpresa no entra a la tombola, y su premio
  // descuenta del total: son 10 impresiones, no 10 mas las sorpresas.
  const sorpresas = elegibles.filter((e) => e.ganadorSorpresa);
  const enTombola = elegibles.filter((e) => !e.ganadorSorpresa);
  const cuposRestantes = Math.max(0, cantidad - sorpresas.length);

  if (cuposRestantes === 0) {
    throw Object.assign(
      new Error(`Ya se entregaron los ${cantidad} premios como sorpresa. No queda nada por sortear.`),
      { status: 400 }
    );
  }
  if (enTombola.length === 0) {
    throw Object.assign(
      new Error('Todavía no hay nadie elegible para sortear'),
      { status: 400 }
    );
  }

  const resultado = sortear(enTombola, cuposRestantes);
  resultado.premiosSorpresa = sorpresas.map((s) => ({
    id: s.id, nombre: s.nombre, celular: s.celular, motivo: s.sorpresaMotivo,
  }));

  await db.send(new PutCommand({
    TableName: config.tablaSorteos,
    Item: { id: CLAVE, ...resultado },
  }));

  return resultado;
}

module.exports = { ultimo, ejecutar, CLAVE };
