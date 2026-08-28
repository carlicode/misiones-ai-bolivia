/**
 * Reduce la foto antes de subirla.
 *
 * Un celular moderno saca fotos de 4 a 12 MB. Para revisar una evidencia
 * sobra con 1600 px de lado, y en el evento la gente va a estar con datos
 * móviles saturados: bajar de 8 MB a 300 KB es la diferencia entre que la
 * subida funcione o se corte a la mitad.
 *
 * Si el navegador no puede decodificar la imagen (pasa con HEIC en algunos
 * Android), se devuelve el archivo original sin tocar: mejor una subida
 * pesada que ninguna.
 */

const LADO_MAX = 1600
const CALIDAD = 0.82

export async function comprimirImagen(archivo: File): Promise<File> {
  // Los HEIC de iPhone no siempre se decodifican; se intenta igual y si falla
  // se cae al original.
  try {
    const bitmap = await crearBitmap(archivo)

    const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height))
    // Ya es pequeña: no vale la pena recomprimir y perder calidad.
    if (escala === 1 && archivo.size < 900_000) {
      bitmap.close?.()
      return archivo
    }

    const ancho = Math.round(bitmap.width * escala)
    const alto = Math.round(bitmap.height * escala)

    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto

    const ctx = lienzo.getContext('2d')
    if (!ctx) return archivo

    ctx.drawImage(bitmap, 0, 0, ancho, alto)
    bitmap.close?.()

    const blob = await new Promise<Blob | null>((resolve) =>
      lienzo.toBlob(resolve, 'image/jpeg', CALIDAD)
    )
    if (!blob || blob.size >= archivo.size) return archivo

    return new File([blob], renombrarAJpg(archivo.name), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return archivo
  }
}

async function crearBitmap(archivo: File): Promise<ImageBitmap> {
  if ('createImageBitmap' in window) {
    return createImageBitmap(archivo)
  }
  // Safari viejo: pasa por un <img> con object URL.
  const url = URL.createObjectURL(archivo)
  try {
    const img = new Image()
    await new Promise((listo, falla) => {
      img.onload = listo
      img.onerror = falla
      img.src = url
    })
    return img as unknown as ImageBitmap
  } finally {
    URL.revokeObjectURL(url)
  }
}

function renombrarAJpg(nombre: string) {
  return nombre.replace(/\.[^.]+$/, '') + '.jpg'
}
