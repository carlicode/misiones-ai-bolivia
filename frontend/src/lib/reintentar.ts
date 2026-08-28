/**
 * Reintentos con espera creciente.
 *
 * La cuenta de AWS tiene un límite bajo de Lambdas en paralelo, así que
 * cuando mucha gente sube su evidencia al mismo tiempo API Gateway devuelve
 * 503 a algunas. No es un error del participante ni de sus datos: es un pico
 * que se pasa en un segundo. Reintentar lo vuelve invisible.
 *
 * Todas las operaciones de la app son seguras de reintentar: registrarse
 * devuelve el mismo registro si el celular ya existe, y enviar una misión
 * sobrescribe la anterior en vez de duplicarla.
 */

/** Códigos que valen la pena reintentar: el servidor está saturado, no roto. */
const REINTENTABLES = [408, 425, 429, 500, 502, 503, 504]

const INTENTOS_MAX = 4
const ESPERA_BASE_MS = 400

export function esReintentable(status: number) {
  return REINTENTABLES.includes(status)
}

/** Espera creciente con algo de azar, para que los celulares no reintenten todos a la vez. */
function espera(intento: number) {
  const base = ESPERA_BASE_MS * 2 ** intento
  const azar = Math.random() * 250
  return new Promise((r) => setTimeout(r, base + azar))
}

/**
 * Ejecuta `hacer` y lo reintenta mientras devuelva una respuesta reintentable
 * o falle la red. Devuelve la última respuesta, sea buena o mala.
 */
export async function conReintentos(hacer: () => Promise<Response>): Promise<Response> {
  let ultimoError: unknown

  for (let intento = 0; intento < INTENTOS_MAX; intento += 1) {
    try {
      const res = await hacer()
      if (!esReintentable(res.status) || intento === INTENTOS_MAX - 1) return res
    } catch (err) {
      // Sin red o conexión cortada: también se reintenta.
      ultimoError = err
      if (intento === INTENTOS_MAX - 1) throw err
    }
    await espera(intento)
  }

  throw ultimoError ?? new Error('No se pudo conectar')
}
