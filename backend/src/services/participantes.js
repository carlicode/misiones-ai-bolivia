const { randomUUID } = require('crypto');
const { GetCommand, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const db = require('../lib/db');
const config = require('../lib/config');
const { calcularEstado } = require('../lib/misiones');

/** Deja el numero en solo digitos para poder compararlo de forma confiable. */
function normalizarCelular(celular) {
  return String(celular || '').replace(/\D/g, '');
}

function validarRegistro(nombre, celular) {
  const nombreLimpio = String(nombre || '').trim().replace(/\s+/g, ' ');
  const celularLimpio = normalizarCelular(celular);

  if (nombreLimpio.length < 5 || !nombreLimpio.includes(' ')) {
    throw Object.assign(new Error('Escribe tu nombre y apellido completos'), { status: 400 });
  }
  if (celularLimpio.length < 8) {
    throw Object.assign(new Error('El celular debe tener al menos 8 digitos'), { status: 400 });
  }
  return { nombre: nombreLimpio, celular: celularLimpio };
}

async function porCelular(celular) {
  const { Items } = await db.send(new QueryCommand({
    TableName: config.tablaParticipantes,
    IndexName: 'celular-index',
    KeyConditionExpression: 'celular = :c',
    ExpressionAttributeValues: { ':c': celular },
    Limit: 1,
  }));
  return Items && Items[0] ? Items[0] : null;
}

async function porId(id) {
  const { Item } = await db.send(new GetCommand({
    TableName: config.tablaParticipantes,
    Key: { id },
  }));
  return Item || null;
}

/**
 * Registra a la persona. Si el celular ya existe devuelve el registro anterior
 * en vez de crear uno nuevo: asi nadie duplica su participacion y quien pierde
 * el localStorage recupera su progreso.
 */
async function registrar(nombreCrudo, celularCrudo) {
  const { nombre, celular } = validarRegistro(nombreCrudo, celularCrudo);

  const existente = await porCelular(celular);
  if (existente) return { participante: existente, nuevo: false };

  const participante = {
    id: randomUUID(),
    nombre,
    celular,
    creadoEn: new Date().toISOString(),
  };

  await db.send(new PutCommand({
    TableName: config.tablaParticipantes,
    Item: participante,
    ConditionExpression: 'attribute_not_exists(id)',
  }));

  return { participante, nuevo: true };
}

/** Arma la vista publica que consume la app: datos + misiones + entradas. */
function componer(participante, misiones) {
  const estado = calcularEstado(misiones);
  return {
    id: participante.id,
    nombre: participante.nombre,
    celular: participante.celular,
    misiones,
    ...estado,
  };
}

async function contar() {
  const { Count } = await db.send(new ScanCommand({
    TableName: config.tablaParticipantes,
    Select: 'COUNT',
  }));
  return Count || 0;
}

async function listarTodos() {
  const items = [];
  let ultimaClave;
  do {
    const res = await db.send(new ScanCommand({
      TableName: config.tablaParticipantes,
      ExclusiveStartKey: ultimaClave,
    }));
    items.push(...(res.Items || []));
    ultimaClave = res.LastEvaluatedKey;
  } while (ultimaClave);
  return items;
}

module.exports = { registrar, porId, porCelular, componer, contar, listarTodos, normalizarCelular };
