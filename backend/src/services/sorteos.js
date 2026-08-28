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
  if (elegibles.length === 0) {
    throw Object.assign(
      new Error('Todavía no hay nadie elegible para sortear'),
      { status: 400 }
    );
  }

  const resultado = sortear(elegibles, cantidad);

  await db.send(new PutCommand({
    TableName: config.tablaSorteos,
    Item: { id: CLAVE, ...resultado },
  }));

  return resultado;
}

module.exports = { ultimo, ejecutar, CLAVE };
