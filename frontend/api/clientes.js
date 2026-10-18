// GET  /api/clientes?buscar=3001234567   → busca por celular, código QR o cliente_id
// POST /api/clientes {nombre, celular}   → registra (o devuelve el existente)
import { ruta } from './_lib/http.js'
import { servicios } from './_lib/index.js'

export default ruta({
  GET: ({ query }) => servicios.buscarCliente(query.buscar),
  POST: ({ body }) => servicios.registrarCliente(body),
})
