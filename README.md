# Misiones AI Bolivia · AWS Community Day 2026

App del sorteo de 10 impresiones 3D del AWS UG AI Bolivia.

## Correr en local

```bash
# terminal 1 — API en :3002
cd backend && npm install && npm run dev

# terminal 2 — app en :5174
cd frontend && npm install && npm run dev
```

El frontend hace proxy de `/api` y `/health` al backend, así que no hay CORS en local.

## Desplegar

```bash
# backend: API Gateway + Lambda + DynamoDB + S3
cd backend
STAFF_KEY='<clave-del-staff>' npx serverless deploy
# anota el ApiUrl que imprime al final

# frontend: Amplify Hosting conectado al repo, con la variable
# VITE_API_URL = <ApiUrl del paso anterior>
```

## Estructura

| Ruta | Qué es |
|---|---|
| `backend/serverless.yml` | Toda la infra: tablas, bucket, Lambda, API |
| `backend/src/lib/misiones.js` | Reglas autoritativas: cuáles son obligatorias y cómo se cuentan las entradas |
| `backend/src/services/` | Acceso a DynamoDB |
| `backend/src/routes/publicas.js` | Endpoints que consume la app |
| `frontend/src/lib/missions.ts` | Textos de las misiones y la agenda de charlas |

## Reglas del sorteo

- **3 misiones obligatorias** aprobadas = elegible, con 1 entrada.
- Cada **bonus** aprobado suma 1 entrada más, hasta 4.
- Las entradas suben la probabilidad, pero **nadie gana más de un premio**: al salir sorteada, la persona se retira de la tómbola con todas sus entradas.
- Hay que **estar presente en el evento** para recibir la impresión 3D.

## Pendiente del sprint 00

- Logo en PNG/SVG con fondo transparente
- Foto o render de la impresión 3D
- Fecha del evento y hora de cierre (para el contador regresivo)
