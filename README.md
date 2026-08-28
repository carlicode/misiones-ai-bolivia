# Misiones AI Bolivia

App del sorteo de 10 impresiones 3D del **AWS User Group AI Bolivia** para el
**AWS Community Day Bolivia 2026** — sábado 29 de agosto, Santa Cruz de la Sierra.

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

## En producción

| | |
|---|---|
| **App** | https://d1jd2g07edoeyf.cloudfront.net |
| **Panel del staff** | https://d1jd2g07edoeyf.cloudfront.net/staff |
| **API** | https://90jz4igs4d.execute-api.us-east-1.amazonaws.com |

El cartel con el QR para el stand está en [`cartel/qr-stand.svg`](cartel/qr-stand.svg)
(A5, listo para imprimir). Para regenerarlo con otra URL:

```bash
node scripts/generar-qr.mjs https://la-url-que-sea
```

---

## Cómo se hizo esta app

La app tiene una sección **«Cómo se hizo esta app»** visible para quien
participa: los siete servicios de AWS que la mueven, y qué resolvió cada uno
aquí en concreto. Al ser un evento de comunidad, la app misma es material
didáctico.

| Servicio | Para qué sirvió |
|---|---|
| **Amazon CloudFront** | Sirve la app. El bucket es privado y guarda copias cerca de Bolivia. |
| **Amazon S3** | Fotos de las evidencias. El celular sube directo con URL prefirmada. |
| **Amazon API Gateway** | Puerta de entrada de las peticiones, sin servidor encendido. |
| **AWS Lambda** | Toda la lógica: registro, misiones, moderación y sorteo. |
| **Amazon DynamoDB** | Participantes, misiones y el sorteo. Índice por celular para recuperar progreso. |
| **AWS CloudFormation** | La infraestructura entera como código, no hecha a mano en la consola. |
| **Amazon CloudWatch** | Métricas. Reveló el límite de concurrencia que motivó los reintentos. |

Los íconos en [`frontend/public/aws/`](frontend/public/aws) son los oficiales
del [paquete de AWS Architecture Icons](https://aws.amazon.com/architecture/icons/)
(edición de julio 2026), que AWS permite usar en materiales de este tipo.

---

## Arquitectura

```
CloudFront ──> S3 privado ──> React + Vite (mobile-first)
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
  public/premio-3d.png        el premio recortado, flota en el hero
  public/social.jpg           vista previa al compartir por WhatsApp
  public/aws/                 iconos oficiales de los servicios de AWS
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

### Backend

```bash
cd backend
STAFF_KEY='la-clave-del-equipo' \
CIERRE_ISO='2026-09-20T15:30:00-04:00' \
npx serverless deploy --stage prod
```

`CIERRE_ISO` es **la hora en que deja de aceptarse participación**, y se aplica
de verdad: después de esa hora la API rechaza registros y evidencias, mientras
el staff sigue pudiendo moderar y sortear. Si la dejas vacía, no se cierra nada.

> La `STAFF_KEY` es lo único que protege el panel. No la subas al repo ni la
> mandes por el grupo general.

### Frontend

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://ugai-web-prod-<cuenta>/ --delete \
  --exclude index.html --exclude '*.webmanifest' \
  --cache-control 'public,max-age=31536000,immutable'
aws s3 cp dist/index.html s3://ugai-web-prod-<cuenta>/index.html \
  --cache-control 'no-cache,must-revalidate'
aws cloudfront create-invalidation --distribution-id <id> --paths '/*'
```

Los assets llevan hash en el nombre, así que van con caché de un año. El
`index.html` no, para que un deploy nuevo se vea al instante.

La infraestructura del hosting está en [`infra/hosting.yml`](infra/hosting.yml):

```bash
aws cloudformation deploy --template-file infra/hosting.yml --stack-name ugai-hosting-prod
```

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

## Ensayo de carga

Simulando **200 participantes con 900 evidencias** contra la API real:

| | p50 | p95 |
|---|---|---|
| Registro | 229 ms | 1.8 s |
| Pedir URL de subida | 221 ms | 254 ms |
| Subir la foto a S3 | 620 ms | 1.3 s |
| Guardar la misión | 231 ms | 267 ms |

**2000 peticiones, 900 fotos, 0 errores.** Costo estimado del evento completo
(300 personas): **menos de 20 centavos de dólar**.

> **La cuenta tiene un límite de 10 Lambdas en paralelo** (el default de AWS es
> 1000). Sin reintentos, 6 de cada 120 registros fallaban con 503 en los picos.
> Con [`reintentar.ts`](frontend/src/lib/reintentar.ts) el problema desaparece,
> pero conviene pedir un aumento de cuota antes del evento:
> `aws service-quotas request-service-quota-increase --service-code lambda --quota-code L-B99A9384 --desired-value 100`

Para dejar limpio después de un ensayo:

```bash
BUCKET_FOTOS=ugai-fotos-prod-<cuenta> node scripts/limpiar-datos-de-prueba.mjs
```

> Borra **todo**, no distingue datos de prueba de datos reales. No lo corras
> una vez que la gente empiece a participar.

---

## Pendiente

- [x] Fecha del evento configurada: cierre el **29/08/2026 a las 15:30** (UTC-4)
- [ ] Que el equipo lea [GUIA-STAFF.md](GUIA-STAFF.md) antes del evento
- [ ] Pedir el aumento de cuota de Lambda (ver arriba). Con los reintentos la
      app funciona igual, así que no bloquea nada.

---

Hecho para la comunidad **AWS AI UG Bolivia**.
