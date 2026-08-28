const { PutCommand, QueryCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const db = require('../lib/db');
const config = require('../lib/config');
const { esMisionValida, validarCampos } = require('../lib/misiones');

/** Todas las misiones enviadas por una persona. */
async function porParticipante(participanteId) {
  const { Items } = await db.send(new QueryCommand({
    TableName: config.tablaMisiones,
    KeyConditionExpression: 'participanteId = :p',
    ExpressionAttributeValues: { ':p': participanteId },
  }));
  return Items || [];
}

/**
 * Guarda una evidencia. Reenviar la misma mision sobrescribe la anterior
 * y la devuelve a 'pendiente', que es justo lo que necesita alguien
 * a quien le rechazaron la foto.
 */
async function enviar({ participanteId, missionId, fotoKey, data }) {
  if (!esMisionValida(missionId)) {
    throw Object.assign(new Error('Mision desconocida'), { status: 400 });
  }
  if (!fotoKey) {
    throw Object.assign(new Error('Falta la foto'), { status: 400 });
  }

  const item = {
    participanteId,
    missionId,
    fotoKey,
    data: validarCampos(missionId, data),
    estado: 'pendiente',
    enviadoEn: new Date().toISOString(),
  };

  await db.send(new PutCommand({ TableName: config.tablaMisiones, Item: item }));
  return item;
}

/** Aprobar o rechazar desde el panel de staff. */
async function revisar({ participanteId, missionId, estado, motivo, revisadoPor }) {
  if (!['aprobada', 'rechazada'].includes(estado)) {
    throw Object.assign(new Error('Estado invalido'), { status: 400 });
  }

  const { Attributes } = await db.send(new UpdateCommand({
    TableName: config.tablaMisiones,
    Key: { participanteId, missionId },
    UpdateExpression:
      'SET estado = :e, motivoRechazo = :m, revisadoEn = :t, revisadoPor = :r',
    ConditionExpression: 'attribute_exists(participanteId)',
    ExpressionAttributeValues: {
      ':e': estado,
      ':m': estado === 'rechazada' ? String(motivo || '').slice(0, 200) : null,
      ':t': new Date().toISOString(),
      ':r': revisadoPor || 'staff',
    },
    ReturnValues: 'ALL_NEW',
  }));

  return Attributes;
}

/** Cola de moderacion: pendientes, las mas antiguas primero. */
async function pendientes(limite = 100) {
  const { Items } = await db.send(new QueryCommand({
    TableName: config.tablaMisiones,
    IndexName: 'estado-index',
    KeyConditionExpression: 'estado = :e',
    ExpressionAttributeValues: { ':e': 'pendiente' },
    ScanIndexForward: true,
    Limit: limite,
  }));
  return Items || [];
}

async function listarTodas() {
  const items = [];
  let ultimaClave;
  do {
    const res = await db.send(new ScanCommand({
      TableName: config.tablaMisiones,
      ExclusiveStartKey: ultimaClave,
    }));
    items.push(...(res.Items || []));
    ultimaClave = res.LastEvaluatedKey;
  } while (ultimaClave);
  return items;
}

module.exports = { porParticipante, enviar, revisar, pendientes, listarTodas };
