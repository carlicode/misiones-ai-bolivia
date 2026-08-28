/**
 * Definicion autoritativa de las misiones. El frontend tiene su propia copia
 * para pintar la UI, pero la validacion y el conteo de entradas se hacen aqui.
 */

const OBLIGATORIAS = ['instagram', 'whatsapp', 'lider'];
const BONUS = ['speaker', 'charla', 'taller'];
const TODAS = [...OBLIGATORIAS, ...BONUS];

/** Campos de texto que cada mision exige ademas de la foto. */
const CAMPOS = {
  instagram: [],
  whatsapp: [],
  lider: [],
  speaker: ['speaker'],
  charla: ['charla', 'aprendizaje'],
  taller: ['taller'],
};

const LIMITE_TEXTO = 200;

function esMisionValida(missionId) {
  return TODAS.includes(missionId);
}

/** Limpia y valida los campos extra. Lanza si falta alguno. */
function validarCampos(missionId, data = {}) {
  const limpio = {};
  for (const campo of CAMPOS[missionId]) {
    const valor = typeof data[campo] === 'string' ? data[campo].trim() : '';
    if (!valor) {
      throw Object.assign(new Error(`Falta completar: ${campo}`), { status: 400 });
    }
    limpio[campo] = valor.slice(0, LIMITE_TEXTO);
  }
  return limpio;
}

/**
 * Una persona es elegible si tiene las 3 obligatorias aprobadas.
 * Cada bonus aprobado suma una entrada extra a la tombola, hasta 4 en total.
 * Las entradas aumentan la probabilidad, pero nadie gana mas de un premio:
 * eso se resuelve en el sorteo, retirando a la persona al salir sorteada.
 */
function calcularEstado(misiones = []) {
  const aprobadas = new Set(
    misiones.filter((m) => m.estado === 'aprobada').map((m) => m.missionId)
  );

  const elegible = OBLIGATORIAS.every((id) => aprobadas.has(id));
  const bonusAprobados = BONUS.filter((id) => aprobadas.has(id)).length;

  return {
    elegible,
    bonusAprobados,
    entradas: elegible ? 1 + bonusAprobados : 0,
    obligatoriasAprobadas: OBLIGATORIAS.filter((id) => aprobadas.has(id)).length,
  };
}

module.exports = {
  OBLIGATORIAS,
  BONUS,
  TODAS,
  CAMPOS,
  esMisionValida,
  validarCampos,
  calcularEstado,
};
