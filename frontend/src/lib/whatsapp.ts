/**
 * Avisar por WhatsApp a un ganador.
 *
 * No hay integración con la API de WhatsApp: se abre el chat con el mensaje
 * ya escrito y la persona del staff aprieta enviar. Para un evento de un día
 * eso alcanza y evita todo el trámite de WhatsApp Business.
 */

const BOLIVIA = '591'

/** Los números se guardan sin prefijo; wa.me lo necesita. */
export function aInternacional(celular: string) {
  const digitos = String(celular || '').replace(/\D/g, '')
  if (digitos.startsWith(BOLIVIA)) return digitos
  return BOLIVIA + digitos
}

export function mensajeGanador(nombre: string, anuncio: string) {
  const primerNombre = nombre.split(' ')[0]
  return (
    `¡Felicidades ${primerNombre}! 🎉 Ganaste uno de los premios del AWS AI UG Bolivia ` +
    `en el Community Day.\n\n` +
    `Espera hasta las ${anuncio} para recibir tu impresión 3D. ` +
    `Recuerda que tienes que estar presente en el evento.`
  )
}

export function enlaceWhatsApp(celular: string, mensaje: string) {
  return `https://wa.me/${aInternacional(celular)}?text=${encodeURIComponent(mensaje)}`
}
