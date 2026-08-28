# Misiones AI Bolivia

App del sorteo de 10 impresiones 3D del **AWS User Group AI Bolivia** para el
AWS Community Day Bolivia 2026.

La gente cumple misiones durante el evento, sube la evidencia desde el celular,
el staff la aprueba, y al final del día se sortean los premios con una tómbola
que se proyecta en vivo.

---

## Cómo funciona

**Para quien participa** — entra por un QR, escribe su nombre y celular, y ya
está. Sin cuenta, sin contraseña. Sube cada misión cuando la tiene: no hay que
esperar a completarlas todas.

**Para el staff** — un panel aparte, con clave, pensado para moderar desde el
celular parado en el stand: foto grande, aprobar o rechazar, siguiente.

**El sorteo** — se corre desde el panel al final del día. Los nombres giran, se
frenan uno por uno hasta los 10 ganadores, y queda un comprobante con el que
cualquiera puede recalcular el resultado.

---

## Las misiones

### Obligatorias — las 3 te meten al sorteo

| | Misión | Evidencia |
|---|---|---|
| 📱 | Publicar en Instagram etiquetando a [@aws_ai_ug_bolivia](https://www.instagram.com/aws_ai_ug_bolivia/) | Screenshot del post |
| 💬 | Unirse al grupo de WhatsApp y presentarse | Screenshot del mensaje |
| 🤳 | Selfie con un líder del UG | La selfie |

### Bonus — cada una suma una entrada más

| | Misión | Evidencia |
|---|---|---|
| 📸 | Foto con un speaker de una charla de AI | Foto + nombre del speaker |
| 🎓 | Asistir a una charla de AI | Foto + cuál charla + un aprendizaje |
| 🛠️ | Completar un taller de AI | Foto de tu pantalla con el resultado |

## Reglas del sorteo

- Con las **3 obligatorias** aprobadas entras con **1 entrada**.
- Cada **bonus** aprobado suma **1 entrada más**, hasta **4 en total**.
- Más entradas suben tu probabilidad, pero **nadie gana más de un premio**: al
  salir sorteada, la persona se retira de la tómbola con todas sus entradas.
- Hay que **estar presente en el evento** para recibir la impresión 3D.
- Los ganadores se anuncian **a las 16:00 en el grupo de WhatsApp**.

Las reglas viven en un solo lugar del código —
[`backend/src/lib/misiones.js`](backend/src/lib/misiones.js) — y el frontend nunca
decide quién es elegible: solo pinta lo que dice el backend.

---

## El sorteo es auditable

La tómbola no trae el resultado escrito de antemano, pero tampoco es un azar
imposible de comprobar. Funciona así:

1. Se genera una **semilla aleatoria** de 16 bytes.
2. Esa semilla alimenta un generador determinista (SHA-256 encadenado).
3. Se sortea, y **la semilla queda guardada** junto al resultado.

Con la semilla, cualquiera puede recalcular el sorteo y obtener exactamente los
mismos 10 ganadores. Si alguien pregunta cómo salieron, hay con qué responder.

```js
const { sortear } = require('./backend/src/lib/sorteo')
sortear(elegibles, 10, 'la-semilla-guardada')  // mismos ganadores, siempre
```

El comprobante (fecha, elegibles, entradas y semilla) se muestra en el panel
debajo de la lista de ganadores.

---

## Arquitectura

```
Amplify Hosting ──> React + Vite (mobile-first)
                         │
                         ▼
                  API Gateway + Lambda (Node, Express)
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         DynamoDB    DynamoDB     S3 (privado)
       participantes  misiones      fotos
                       sorteos
```

**Las fotos nunca pasan por la Lambda.** El celular pide una URL prefirmada y
sube directo a S3. La Lambda solo guarda la referencia. Eso es lo que hace que
el pico del evento no la tumbe, y que subir una foto pesada desde un celular con
mal internet no cueste tiempo de cómputo.

**El bucket es privado.** Para que el staff vea una evidencia se genera una URL
de lectura temporal de una hora. Las fotos se borran solas a los 90 días.

### Tablas

| Tabla | Clave | Guarda |
|---|---|---|
| `ugai-participantes-*` | `id` (+ índice por `celular`) | Nombre y celular |
| `ugai-misiones-*` | `participanteId` + `missionId` (+ índice por `estado`) | Evidencias y su estado |
| `ugai-sorteos-*` | `id` | El último sorteo con su semilla |

El índice por `celular` cumple dos funciones: evita registros duplicados y deja
recuperar el progreso si alguien pierde los datos de su navegador.

El índice por `estado` es el que alimenta la cola de moderación sin escanear
toda la tabla.

### Estructura

```
backend/
  serverless.yml              toda la infra: tablas, bucket, Lambda, API
  src/lib/misiones.js         reglas del juego (obligatorias, bonus, entradas)
  src/lib/sorteo.js           la tómbola auditable
  src/lib/staffAuth.js        clave del panel, comparada sin filtrar tiempo
  src/services/               acceso a DynamoDB
  src/routes/publicas.js      lo que consume la app
  src/routes/staff.js         lo que consume el panel

frontend/
  src/lib/missions.ts         textos de las misiones y la agenda de charlas
  src/components/             app del participante
  src/components/staff/       panel de moderación y tómbola
  public/premio-3d.jpg        foto del premio (flota en el hero)
```

---

## Correr en local

```bash
# terminal 1 — API en :3002
cd backend && npm install && npm run dev

# terminal 2 — app en :5174
cd frontend && npm install && npm run dev
```

El frontend hace proxy de `/api` y `/health` al backend, así que no hay CORS
en local. La app queda en `localhost:5174` y el panel en `localhost:5174/staff`.

## Desplegar

```bash
cd backend
STAFF_KEY='la-clave-del-equipo' npx serverless deploy --stage prod
```

Al terminar imprime la URL de la API. Esa URL va como `VITE_API_URL` en las
variables de entorno de Amplify Hosting, que buildea el frontend con
[`amplify.yml`](amplify.yml).

> La `STAFF_KEY` es lo único que protege el panel. No la subas al repo ni la
> mandes por el grupo general.

---

## Cómo se usa el día del evento

1. **Apertura** — el QR visible en el stand y mencionado desde el escenario.
2. **Durante el día** — el staff modera la cola desde el celular. Conviene no
   dejarla acumular: revisar cada rato es más rápido que hacerlo todo al final.
3. **Cierre de participación** — se deja de aceptar evidencias.
4. **Antes de las 16:00** — vaciar la cola pendiente, entrar a la pestaña
   **Sorteo** y correrlo. Vale la pena grabar la animación.
5. **16:00** — botón *Copiar para WhatsApp* y pegar la lista en el grupo.
6. **Entrega** — solo a quien esté presente.

Si alguien reclama en el stand, la pestaña **Buscar** encuentra a la persona por
nombre o celular y muestra el estado de cada una de sus misiones.

---

## Detalles pensados para el día del evento

- **Las fotos se comprimen en el celular antes de subir.** Una foto de iPhone
  de 5 MB sale como 750 KB a 1600 px, que sobra para revisar una evidencia.
  Con los datos móviles saturados de un evento, esa es la diferencia entre que
  la subida termine o se corte. Si la imagen ya es chica, se deja intacta.
- **Se instala como app.** Manifest, íconos y `standalone`: quien la agrega a
  su pantalla de inicio la abre sin barra del navegador.
- **Confeti al completar las 3 obligatorias** — el momento que vale la pena
  celebrar es cuando entras al sorteo. Son 40 líneas de canvas en vez de una
  librería de 30 KB.
- **Contador regresivo** fijo arriba, y contador social abajo (*«N
  participando»*) para que se note que la gente está entrando.

## Pendiente

- [ ] Fecha y hora reales del evento en `DEADLINE`
      ([`frontend/src/lib/missions.ts`](frontend/src/lib/missions.ts)) — hoy
      tiene un valor de marcador para el contador regresivo
- [ ] Ensayo general con el equipo antes del día del evento

---

Hecho para la comunidad **AWS AI UG Bolivia**.
