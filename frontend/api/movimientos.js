// GET  /api/movimientos?clienteId=<hex>  |  ?comercioId=<uuid>  → historial
// POST /api/movimientos {txHash}  → indexa una entrega/redención ya confirmada en la red
import { ruta } from './_lib/http.js'
import { servicios } from './_lib/index.js'

export default ruta({
  GET: ({ query }) => servicios.listarMovimientos(query),
  POST: ({ body }) => servicios.registrarMovimiento(body),
})
