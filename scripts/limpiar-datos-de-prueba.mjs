/**
 * Borra TODOS los participantes, misiones, sorteos y fotos.
 *
 * Sirve para dejar limpio despues de un ensayo, antes del dia del evento.
 * Usa BatchWriteItem (25 items por llamada, en paralelo): vaciar ~1700
 * registros toma segundos.
 *
 * OJO: esto borra todo, no distingue datos de prueba de datos reales.
 * No lo corras despues de que la gente empiece a participar.
 */
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Usa los SDK que ya estan instalados en backend/
const aqui = dirname(fileURLToPath(import.meta.url))
const require = createRequire(join(aqui, '..', 'backend') + '/')

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb')
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3')

const REGION = process.env.AWS_REGION ?? 'us-east-1'
const BUCKET = process.env.BUCKET_FOTOS
if (!BUCKET) {
  console.error('Falta BUCKET_FOTOS. Ejemplo:\n  BUCKET_FOTOS=ugai-fotos-prod-<cuenta> node scripts/limpiar-datos-de-prueba.mjs')
  process.exit(1)
}
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const s3 = new S3Client({ region: REGION })

const enTrozos = (arr, n) =>
  Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

async function escanear(tabla) {
  const items = []
  let clave
  do {
    const r = await db.send(new ScanCommand({ TableName: tabla, ExclusiveStartKey: clave }))
    items.push(...(r.Items ?? []))
    clave = r.LastEvaluatedKey
  } while (clave)
  return items
}

/** BatchWrite puede devolver items sin procesar: hay que reintentarlos. */
async function borrarLote(tabla, claves) {
  let pendientes = claves.map((Key) => ({ DeleteRequest: { Key } }))
  for (let intento = 0; intento < 5 && pendientes.length; intento += 1) {
    const r = await db.send(new BatchWriteCommand({ RequestItems: { [tabla]: pendientes } }))
    pendientes = r.UnprocessedItems?.[tabla] ?? []
    if (pendientes.length) await new Promise((res) => setTimeout(res, 250 * 2 ** intento))
  }
  return pendientes.length
}

async function vaciarTabla(tabla, aClave) {
  const items = await escanear(tabla)
  if (!items.length) return 0

  const lotes = enTrozos(items.map(aClave), 25)
  // De a 8 lotes en paralelo: rapido sin saturar la tabla.
  for (const grupo of enTrozos(lotes, 8)) {
    await Promise.all(grupo.map((l) => borrarLote(tabla, l)))
  }
  return items.length
}

async function vaciarBucket() {
  let total = 0
  let token
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token }))
    const objetos = (r.Contents ?? []).map((o) => ({ Key: o.Key }))
    if (objetos.length) {
      for (const lote of enTrozos(objetos, 1000)) {
        await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: lote } }))
        total += lote.length
      }
    }
    token = r.NextContinuationToken
  } while (token)
  return total
}

const t0 = Date.now()

const [participantes, misiones, sorteos, fotos] = await Promise.all([
  vaciarTabla('ugai-participantes-prod', (i) => ({ id: i.id })),
  vaciarTabla('ugai-misiones-prod', (i) => ({ participanteId: i.participanteId, missionId: i.missionId })),
  vaciarTabla('ugai-sorteos-prod', (i) => ({ id: i.id })),
  vaciarBucket(),
])

console.log(`participantes borrados: ${participantes}`)
console.log(`misiones borradas:      ${misiones}`)
console.log(`sorteos borrados:       ${sorteos}`)
console.log(`fotos borradas:         ${fotos}`)
console.log(`\nduracion: ${((Date.now() - t0) / 1000).toFixed(1)}s`)
