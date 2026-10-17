// Utilidades HTTP comunes a todas las rutas de /api.
// Funcionan igual en Vercel (funciones Node) y en `npm run dev` (plugin de Vite).

export class ErrorApi extends Error {
  constructor(status, mensaje) {
    super(mensaje)
    this.status = status
  }
}

async function leerJson(req) {
  if (req.body && typeof req.body === 'object') return req.body // Vercel ya lo parseó
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {}
  const partes = []
  for await (const parte of req) partes.push(parte)
  const texto = Buffer.concat(partes).toString('utf8')
  return texto ? JSON.parse(texto) : {}
}

function responder(res, status, datos) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(datos))
}

/**
 * Crea un handler a partir de un objeto { GET: fn, POST: fn }.
 * Cada fn recibe { query, body } y devuelve los datos de la respuesta
 * (o { status, datos } si necesita otro código).
 */
export function ruta(metodos) {
  return async function handler(req, res) {
    try {
      const atender = metodos[req.method]
      if (!atender) return responder(res, 405, { error: 'Método no permitido' })
      const url = new URL(req.url, 'http://localhost')
      const query = Object.fromEntries(url.searchParams)
      const body = req.method === 'GET' ? {} : await leerJson(req)
      const resultado = await atender({ query, body })
      if (resultado && resultado.status && 'datos' in resultado) {
        return responder(res, resultado.status, resultado.datos)
      }
      return responder(res, 200, resultado ?? {})
    } catch (e) {
      if (e instanceof SyntaxError) return responder(res, 400, { error: 'El cuerpo no es JSON válido' })
      const status = e.status || 500
      if (status >= 500) console.error('[api]', e)
      return responder(res, status, { error: status >= 500 ? 'Error interno del servidor' : e.message })
    }
  }
}
