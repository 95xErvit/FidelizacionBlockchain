// Prueba el "envoltorio" HTTP con peticiones simuladas (sin servidor real).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { ErrorApi, ruta } from '../_lib/http.js'

function peticion(method, url, cuerpo) {
  const req = Readable.from(cuerpo === undefined ? [] : [Buffer.from(cuerpo)])
  Object.assign(req, { method, url })
  return req
}

function respuesta() {
  const res = { headers: {}, statusCode: 0, cuerpo: '' }
  res.setHeader = (k, v) => (res.headers[k] = v)
  res.end = (t) => (res.cuerpo = t)
  res.json = () => JSON.parse(res.cuerpo)
  return res
}

const handler = ruta({
  GET: ({ query }) => ({ eco: query.x }),
  POST: ({ body }) => {
    if (!body.ok) throw new ErrorApi(400, 'falta ok')
    if (body.romper) throw new Error('detalle interno')
    return { status: 201, datos: { creado: true } }
  },
})

test('GET pasa los parámetros de la URL', async () => {
  const res = respuesta()
  await handler(peticion('GET', '/api/x?x=hola'), res)
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.json(), { eco: 'hola' })
})

test('POST con status propio', async () => {
  const res = respuesta()
  await handler(peticion('POST', '/api/x', '{"ok":true}'), res)
  assert.equal(res.statusCode, 201)
})

test('errores conocidos devuelven su mensaje; los internos no se filtran', async () => {
  let res = respuesta()
  await handler(peticion('POST', '/api/x', '{}'), res)
  assert.deepEqual([res.statusCode, res.json().error], [400, 'falta ok'])

  res = respuesta()
  const original = console.error
  console.error = () => {}
  await handler(peticion('POST', '/api/x', '{"ok":true,"romper":true}'), res)
  console.error = original
  assert.deepEqual([res.statusCode, res.json().error], [500, 'Error interno del servidor'])
})

test('JSON inválido da 400 y método no soportado da 405', async () => {
  let res = respuesta()
  await handler(peticion('POST', '/api/x', '{mal'), res)
  assert.equal(res.statusCode, 400)
  res = respuesta()
  await handler(peticion('DELETE', '/api/x'), res)
  assert.equal(res.statusCode, 405)
})

test('acepta el body ya parseado por Vercel', async () => {
  const req = peticion('POST', '/api/x')
  req.body = { ok: true }
  const res = respuesta()
  await handler(req, res)
  assert.equal(res.statusCode, 201)
})
