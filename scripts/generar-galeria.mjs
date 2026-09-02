/**
 * Arma la galería pública a partir de las evidencias aprobadas en producción
 * y deja todo listo en ./galeria-salida/ para subir a S3.
 *
 * Solo toma selfies con líderes, fotos con speakers y fotos de charlas.
 * Deja AFUERA las capturas de Instagram y de WhatsApp: una captura de un
 * grupo de WhatsApp muestra nombres y números de gente que nunca participó
 * del sorteo, y eso no es publicable sin su consentimiento.
 *
 * Cada foto se reencoda al bajarla, lo que de paso elimina los EXIF
 * (pueden traer ubicación GPS y modelo de celular).
 *
 * Uso:
 *   node scripts/generar-galeria.mjs
 *
 * Después, para publicar (ver el bloque que imprime al final):
 *   aws s3 sync galeria-salida/ s3://<bucket>/galeria/ ...
 *   aws cloudfront create-invalidation --paths "/galeria/*" ...
 */
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync, writeFileSync, readFileSync } from 'fs'

const aqui = dirname(fileURLToPath(import.meta.url))
const require = createRequire(join(aqui, '..', 'backend') + '/')

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  console.error('Falta la dependencia "sharp". Instálala con:\n  npm install sharp')
  process.exit(1)
}

const REGION = process.env.AWS_REGION ?? 'us-east-1'
const STAGE = process.env.STAGE ?? 'prod'
const BUCKET_FOTOS = process.env.BUCKET_FOTOS
if (!BUCKET_FOTOS) {
  console.error('Falta BUCKET_FOTOS. Ejemplo:\n  BUCKET_FOTOS=ugai-fotos-prod-<cuenta> node scripts/generar-galeria.mjs')
  process.exit(1)
}

const SALIDA = join(aqui, '..', 'galeria-salida')
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const s3 = new S3Client({ region: REGION })

// Solo estas tres: son fotos DEL EVENTO. Instagram y WhatsApp son capturas
// de pantalla, no fotos, y la de WhatsApp expone a terceros.
const PUBLICABLES = ['lider', 'speaker', 'charla']
const ETIQUETA = { lider: 'Con un líder del UG', speaker: 'Con un speaker', charla: 'En una charla de AI' }
const FILTRO = { lider: 'Selfies con líderes', speaker: 'Con speakers', charla: 'En las charlas' }

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

async function descargarConReintento(key, intentos = 4) {
  for (let i = 0; i < intentos; i += 1) {
    try {
      const r = await s3.send(new GetObjectCommand({ Bucket: BUCKET_FOTOS, Key: key }))
      return Buffer.from(await r.Body.transformToByteArray())
    } catch (err) {
      if (i === intentos - 1) throw err
      await new Promise((res) => setTimeout(res, 500 * 2 ** i))
    }
  }
}

console.log('Leyendo evidencias aprobadas...')
const misiones = await escanear(`ugai-misiones-${STAGE}`)
const elegidas = misiones.filter((m) => PUBLICABLES.includes(m.missionId) && m.estado === 'aprobada')

console.log(`${elegidas.length} publicables de ${misiones.length} evidencias totales`)
for (const t of PUBLICABLES) console.log(`  ${t}: ${elegidas.filter((m) => m.missionId === t).length}`)

mkdirSync(join(SALIDA, 'full'), { recursive: true })
mkdirSync(join(SALIDA, 'thumb'), { recursive: true })

const items = []
let n = 0
for (const m of elegidas) {
  const buf = await descargarConReintento(m.fotoKey)
  const id = `f${String(++n).padStart(3, '0')}`

  // Reencodear (no solo copiar) es lo que quita los EXIF.
  await sharp(buf).rotate().resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 82 }).toFile(join(SALIDA, 'full', `${id}.jpg`))
  await sharp(buf).rotate().resize({ width: 500, height: 500, fit: 'cover' })
    .jpeg({ quality: 74 }).toFile(join(SALIDA, 'thumb', `${id}.jpg`))

  items.push({ id, mision: m.missionId })
  process.stdout.write('.')
}
console.log(`\n${items.length} fotos procesadas, sin EXIF`)

// ---------- portada para compartir por WhatsApp ----------
// Un mosaico de varias fotos, no una sola persona ocupando toda la miniatura:
// la vista previa del link es lo primero que ve todo el mundo, y una selfie
// individual ahí tiene mucha más exposición que ser una miniatura entre 39.
if (items.length >= 6) {
  const LADO = 210
  const elegidasPortada = [items[0], items[Math.floor(items.length * 0.2)], items[Math.floor(items.length * 0.4)],
    items[Math.floor(items.length * 0.6)], items[Math.floor(items.length * 0.8)], items[items.length - 1]]

  const miniaturas = await Promise.all(
    elegidasPortada.map((it) =>
      sharp(join(SALIDA, 'full', `${it.id}.jpg`))
        .resize({ width: LADO, height: LADO, fit: 'cover' })
        .modulate({ brightness: 0.82, saturation: 0.9 })
        .toBuffer()
    )
  )
  const columnas = 3
  const capas = miniaturas.map((buf, i) => ({ input: buf, left: (i % columnas) * LADO, top: Math.floor(i / columnas) * LADO }))
  const mosaico = await sharp({ create: { width: LADO * columnas, height: LADO * 2, channels: 3, background: '#0A0B0F' } })
    .composite(capas).png().toBuffer()
  const fondo = await sharp(mosaico).resize({ width: 1200, height: 630, fit: 'cover' }).toBuffer()

  const overlay = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0A0B0F" stop-opacity="0.97"/>
        <stop offset="52%" stop-color="#0A0B0F" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#0A0B0F" stop-opacity="0.15"/>
      </linearGradient></defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <text x="60" y="228" font-family="Helvetica,Arial,sans-serif" font-size="21" letter-spacing="4" fill="#3DF5A0">AWS AI UG BOLIVIA</text>
      <text x="60" y="300" font-family="Helvetica,Arial,sans-serif" font-size="58" font-weight="bold" fill="#F3F4F6">Así se vivió el</text>
      <text x="60" y="368" font-family="Helvetica,Arial,sans-serif" font-size="58" font-weight="bold" fill="#3DF5A0">Community Day</text>
      <text x="60" y="418" font-family="Helvetica,Arial,sans-serif" font-size="24" fill="#C4C8D0">${items.length} fotos compartidas por la comunidad</text>
    </svg>`)
  await sharp(fondo).composite([{ input: overlay }]).jpeg({ quality: 87 }).toFile(join(SALIDA, 'social.jpg'))
  console.log('social.jpg lista (portada para compartir)')
}

// ---------- la página ----------
const tarjetas = items.map((it) =>
  `<figure class="foto" data-mision="${it.mision}">
    <img src="thumb/${it.id}.jpg" data-full="full/${it.id}.jpg" alt="${ETIQUETA[it.mision]}" loading="lazy" width="500" height="500">
    <figcaption>${ETIQUETA[it.mision]}</figcaption>
  </figure>`
).join('\n')

const conteos = Object.fromEntries(Object.keys(ETIQUETA).map((k) => [k, items.filter((i) => i.mision === k).length]))
const filtros = Object.entries(FILTRO)
  .map(([k, label]) => `<button class="chip" data-mision="${k}">${label} <span>${conteos[k]}</span></button>`)
  .join('\n')

const html = readFileSync(join(aqui, 'plantilla-galeria.html'), 'utf8')
  .replace('__TARJETAS__', tarjetas)
  .replace('__FILTROS__', filtros)
  .replaceAll('__TOTAL__', String(items.length))

writeFileSync(join(SALIDA, 'index.html'), html)
console.log(`\n${SALIDA}/index.html listo (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, las fotos se sirven aparte)`)

console.log(`
Para publicarla en el mismo hosting de la app:

  BUCKET=<el bucket del sitio, ej. ugai-web-prod-...>
  aws s3 sync galeria-salida/thumb s3://\$BUCKET/galeria/thumb --cache-control "public,max-age=31536000,immutable"
  aws s3 sync galeria-salida/full  s3://\$BUCKET/galeria/full  --cache-control "public,max-age=31536000,immutable"
  aws s3 cp galeria-salida/social.jpg  s3://\$BUCKET/galeria/social.jpg  --cache-control "public,max-age=31536000,immutable"
  aws s3 cp galeria-salida/index.html  s3://\$BUCKET/galeria/index.html --cache-control "no-cache,must-revalidate" --content-type "text/html; charset=utf-8"
  aws cloudfront create-invalidation --distribution-id <id> --paths "/galeria/*"
`)
