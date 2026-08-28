/**
 * Genera el cartel con el QR para pegar en el stand.
 *
 * Sale un SVG en tamaño A5 vertical, listo para imprimir. Se usa SVG y no PNG
 * porque el QR queda nítido a cualquier tamaño: sirve igual para una hoja o
 * para un banner.
 *
 *   node scripts/generar-qr.mjs https://d1234.cloudfront.net
 */
import QRCode from 'qrcode'
import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const url = process.argv[2]
if (!url) {
  console.error('Falta la URL.\n  node scripts/generar-qr.mjs https://tu-app.cloudfront.net')
  process.exit(1)
}

const aqui = dirname(fileURLToPath(import.meta.url))
const salida = join(aqui, '..', 'cartel')
mkdirSync(salida, { recursive: true })

// Corrección de errores alta: el cartel va a estar en un stand con gente
// delante, media luz y posiblemente algo tapándolo en parte.
const qr = await QRCode.toString(url, {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 0,
  color: { dark: '#0A0B0F', light: '#FFFFFF' },
})

// Se queda solo con el contenido interno del SVG del QR para poder
// posicionarlo dentro del cartel.
const cuerpoQr = qr
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
const viewBoxQr = qr.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 41 41'

const ANCHO = 1240   // A5 a 150 dpi
const ALTO = 1748
const QR_LADO = 620
const QR_X = (ANCHO - QR_LADO) / 2

const cartel = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}">
  <rect width="${ANCHO}" height="${ALTO}" fill="#0A0B0F"/>

  <text x="${ANCHO / 2}" y="215" text-anchor="middle"
        font-family="Space Grotesk, Helvetica, Arial, sans-serif" font-size="34"
        letter-spacing="7" fill="#8B5CF6">AWS AI UG BOLIVIA</text>

  <text x="${ANCHO / 2}" y="360" text-anchor="middle"
        font-family="Space Grotesk, Helvetica, Arial, sans-serif" font-size="104"
        font-weight="700" fill="#F3F4F6">Gana una</text>
  <text x="${ANCHO / 2}" y="480" text-anchor="middle"
        font-family="Space Grotesk, Helvetica, Arial, sans-serif" font-size="104"
        font-weight="700" fill="#3DF5A0">impresión 3D</text>

  <text x="${ANCHO / 2}" y="580" text-anchor="middle"
        font-family="Space Grotesk, Helvetica, Arial, sans-serif" font-size="40"
        fill="#979BA6">Cumple 3 misiones y entra al sorteo</text>

  <rect x="${QR_X - 34}" y="${666}" width="${QR_LADO + 68}" height="${QR_LADO + 68}"
        rx="34" fill="#FFFFFF"/>
  <svg x="${QR_X}" y="700" width="${QR_LADO}" height="${QR_LADO}" viewBox="${viewBoxQr}">
    ${cuerpoQr}
  </svg>

  <text x="${ANCHO / 2}" y="1470" text-anchor="middle"
        font-family="Space Grotesk, Helvetica, Arial, sans-serif" font-size="46"
        font-weight="600" fill="#F3F4F6">Escanea con tu celular</text>

  <text x="${ANCHO / 2}" y="1545" text-anchor="middle"
        font-family="JetBrains Mono, Menlo, monospace" font-size="26"
        fill="#5B5F6B">${url.replace(/^https?:\/\//, '')}</text>

  <text x="${ANCHO / 2}" y="1650" text-anchor="middle"
        font-family="Space Grotesk, Helvetica, Arial, sans-serif" font-size="28"
        fill="#5B5F6B">10 premios · Anuncio 16:00 en el grupo de WhatsApp</text>
</svg>
`

writeFileSync(join(salida, 'qr-stand.svg'), cartel)
writeFileSync(join(salida, 'qr-solo.svg'), qr)

console.log(`Cartel  : cartel/qr-stand.svg   (A5, listo para imprimir)`)
console.log(`QR solo : cartel/qr-solo.svg    (por si lo quieres en otro diseño)`)
console.log(`Apunta a: ${url}`)
