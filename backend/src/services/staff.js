const participantesSvc = require('./participantes');
const misionesSvc = require('./misiones');
const { urlDeLectura } = require('../lib/s3');
const { calcularEstado, OBLIGATORIAS } = require('../lib/misiones');

/** Indexa los participantes por id para no consultar la tabla una vez por evidencia. */
async function mapaDeParticipantes() {
  const lista = await participantesSvc.listarTodos();
  return new Map(lista.map((p) => [p.id, p]));
}

/**
 * Cola de moderacion: cada evidencia pendiente con el nombre de quien la envio
 * y una URL temporal para ver la foto (el bucket es privado).
 */
async function cola() {
  const [pendientes, porId] = await Promise.all([
    misionesSvc.pendientes(),
    mapaDeParticipantes(),
  ]);

  const items = await Promise.all(
    pendientes.map(async (m) => {
      const p = porId.get(m.participanteId);
      return {
        participanteId: m.participanteId,
        missionId: m.missionId,
        nombre: p ? p.nombre : 'Participante eliminado',
        celular: p ? p.celular : '',
        data: m.data || {},
        enviadoEn: m.enviadoEn,
        fotoUrl: await urlDeLectura(m.fotoKey),
      };
    })
  );

  return items;
}

/** Resumen que se muestra arriba del panel. */
async function totales() {
  const [todas, porId] = await Promise.all([
    misionesSvc.listarTodas(),
    mapaDeParticipantes(),
  ]);

  const agrupadas = new Map();
  for (const m of todas) {
    if (!agrupadas.has(m.participanteId)) agrupadas.set(m.participanteId, []);
    agrupadas.get(m.participanteId).push(m);
  }

  let elegibles = 0;
  let entradas = 0;
  for (const lista of agrupadas.values()) {
    const estado = calcularEstado(lista);
    if (estado.elegible) {
      elegibles += 1;
      entradas += estado.entradas;
    }
  }

  const sorpresas = [...porId.values()].filter((p) => p.ganadorSorpresa).length;

  return {
    participantes: porId.size,
    pendientes: todas.filter((m) => m.estado === 'pendiente').length,
    elegibles,
    entradas,
    sorpresas,
  };
}

/**
 * Quienes ya cumplen las 3 obligatorias, con sus entradas.
 * Es la lista que alimenta la tombola del sorteo.
 */
async function elegibles() {
  const [todas, porId] = await Promise.all([
    misionesSvc.listarTodas(),
    mapaDeParticipantes(),
  ]);

  const agrupadas = new Map();
  for (const m of todas) {
    if (!agrupadas.has(m.participanteId)) agrupadas.set(m.participanteId, []);
    agrupadas.get(m.participanteId).push(m);
  }

  const lista = [];
  for (const [id, misiones] of agrupadas.entries()) {
    const estado = calcularEstado(misiones);
    if (!estado.elegible) continue;
    const p = porId.get(id);
    if (!p) continue;
    lista.push({
      id,
      nombre: p.nombre,
      celular: p.celular,
      entradas: estado.entradas,
      bonusAprobados: estado.bonusAprobados,
      ganadorSorpresa: Boolean(p.ganadorSorpresa),
      sorpresaMotivo: p.sorpresaMotivo || null,
    });
  }

  return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/** Busqueda por nombre o celular, para resolver reclamos en el stand. */
async function buscar(consulta) {
  const q = String(consulta || '').trim().toLowerCase();
  if (q.length < 2) return [];

  const soloDigitos = q.replace(/\D/g, '');
  const [lista, todas] = await Promise.all([
    participantesSvc.listarTodos(),
    misionesSvc.listarTodas(),
  ]);

  const porParticipante = new Map();
  for (const m of todas) {
    if (!porParticipante.has(m.participanteId)) porParticipante.set(m.participanteId, []);
    porParticipante.get(m.participanteId).push(m);
  }

  return lista
    .filter((p) => {
      const nombre = p.nombre.toLowerCase();
      const coincideNombre = nombre.includes(q);
      const coincideCelular = soloDigitos.length >= 3 && p.celular.includes(soloDigitos);
      return coincideNombre || coincideCelular;
    })
    .slice(0, 25)
    .map((p) => {
      const misiones = porParticipante.get(p.id) || [];
      return {
        id: p.id,
        nombre: p.nombre,
        celular: p.celular,
        ganadorSorpresa: Boolean(p.ganadorSorpresa),
        sorpresaMotivo: p.sorpresaMotivo || null,
        ...calcularEstado(misiones),
        misiones: misiones.map((m) => ({
          missionId: m.missionId,
          estado: m.estado,
          enviadoEn: m.enviadoEn,
        })),
      };
    });
}

module.exports = { cola, totales, elegibles, buscar, OBLIGATORIAS };
