# Backend · API de Puntos del Barrio

Funciones del servidor que viven junto al front. En **Vercel** cada archivo de esta carpeta es un endpoint (`/api/clientes`, `/api/comercios`…). En local, `npm run dev` las sirve igual gracias a un plugin en `vite.config.js`.

## Qué hace y por qué existe

El contrato guarda lo que tiene que ser **público e inalterable**: saldos, comercios y reglas. El backend guarda lo que **no debe ir a la blockchain** y sirve de puente:

| Responsabilidad | Dónde |
|---|---|
| Nombre y celular del cliente ↔ su `cliente_id` anónimo | Tabla `clientes` |
| Datos del comercio (nombre, barrio, responsable) ↔ su cuenta Stellar | Tabla `comercios` |
| Historial de entregas y redenciones con su hash | Tabla `movimientos` |

**Regla de oro: el backend no le cree al navegador.** Para guardar un movimiento, el front solo manda el `txHash`. El servidor le pregunta a la red (Soroban RPC) qué pasó en esa transacción: qué función del contrato se llamó, quién firmó, a qué cliente y cuántos puntos. Si la transacción no existe, falló o es de otro contrato, no se guarda nada.

```
Front ──firma con wallet──▶ Contrato (testnet) ──hash──▶ Front ──POST {txHash}──▶ API
                                                                                 │
                                       verifica en la red (RPC) ◀────────────────┤
                                       guarda en Supabase       ◀────────────────┘
```

## Endpoints

| Método y ruta | Cuerpo / parámetros | Respuesta |
|---|---|---|
| `GET /api/salud` | — | Revisa la configuración |
| `POST /api/clientes` | `{ nombre, celular }` | `{ cliente, yaExistia }` (201 si es nuevo) |
| `GET /api/clientes?buscar=` | celular, código QR (`id`) o `cliente_id` | `{ cliente }` |
| `GET /api/comercios` | — | `{ comercios: [...] }` |
| `POST /api/comercios` | `{ nombre, barrio, responsable, cuenta }` | Solicitud pendiente (201) |
| `POST /api/comercios?accion=sincronizar` | `{ id?, txHash }` de `registrar_comercio` / `desactivar_comercio` | `{ comercio }` aprobado o inactivo |
| `POST /api/comercios?accion=rechazar` | `{ id }` | `{ comercio }` rechazado |
| `POST /api/movimientos` | `{ txHash }` de `emitir_puntos` / `redimir` | `{ movimiento, yaExistia }` |
| `GET /api/movimientos?clienteId=` o `?comercioId=` | — | `{ movimientos: [...] }` (los 50 más recientes) |
| `GET /api/resumen` | — | `{ clientes, emitidos, redimidos, enCirculacion, porComercio }` |

Errores: `{ "error": "mensaje para el usuario" }` con código 400 (dato inválido), 404 (no existe), 409 (conflicto), 422 (la transacción no sirve) o 500.

## Archivos

```
api/
├── clientes.js · comercios.js · movimientos.js · salud.js   ← endpoints (delgados)
├── _lib/
│   ├── servicios.js   lógica de negocio (validaciones, qué se guarda)
│   ├── stellar.js     lee y verifica transacciones en la red
│   ├── repo.js        consultas a Supabase
│   ├── http.js        manejo de peticiones, respuestas y errores
│   └── index.js       arma los servicios con la base y la red reales
└── _test/             26 pruebas: npm test
```

Las carpetas que empiezan con `_` no son endpoints (Vercel las ignora).

## Configuración

Copia `.env.example` como `.env.local` y completa `VITE_CONTRACT_ID` y `SUPABASE_SECRET_KEY`. En Vercel van las mismas variables en **Settings → Environment Variables**.

> `SUPABASE_SECRET_KEY` nunca lleva prefijo `VITE_`: así Vite no la mete en el código del navegador.
