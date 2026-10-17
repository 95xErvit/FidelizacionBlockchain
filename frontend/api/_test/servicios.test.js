// Prueba la lógica del backend con una base de datos en memoria y una red simulada.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { crearServicios } from '../_lib/servicios.js'
import { ErrorApi } from '../_lib/http.js'

const ROSA = 'G' + 'A'.repeat(55)
const PANADERIA = 'G' + 'B'.repeat(55)
const CAMILA = 'c'.repeat(64)
const TX = (n) => String(n).repeat(64).slice(0, 64)

function repoEnMemoria() {
  let seq = 0
  const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`
  const comercios = [
    { id: uuid(), nombre: 'Tienda Doña Rosa', cuenta_stellar: ROSA, estado: 'aprobado', limite_mensual: 5000 },
    { id: uuid(), nombre: 'Panadería El Trigal', cuenta_stellar: PANADERIA, estado: 'aprobado', limite_mensual: 3000 },
    { id: uuid(), nombre: 'Droguería La 33', cuenta_stellar: null, estado: 'pendiente', limite_mensual: 2000 },
  ]
  const clientes = [{ id: uuid(), nombre: 'Camila', celular: '3001234567', cliente_id: CAMILA }]
  const movimientos = []
  const conComercio = (m) => ({ ...m, comercios: { nombre: comercios.find((c) => c.id === m.comercio_id).nombre } })
  return {
    comercios, clientes, movimientos,
    clientePorCelular: async (cel) => clientes.find((c) => c.celular === cel) ?? null,
    clientePorClienteId: async (h) => clientes.find((c) => c.cliente_id === h) ?? null,
    clientePorId: async (id) => clientes.find((c) => c.id === id) ?? null,
    crearCliente: async (d) => { const c = { id: uuid(), cliente_id: 'd'.repeat(64), ...d }; clientes.push(c); return c },
    listarComercios: async () => comercios,
    comercioPorId: async (id) => comercios.find((c) => c.id === id) ?? null,
    comercioPorCuenta: async (cta) => comercios.find((c) => c.cuenta_stellar === cta) ?? null,
    crearComercio: async (d) => { const c = { id: uuid(), limite_mensual: 2000, ...d }; comercios.push(c); return c },
    actualizarComercio: async (id, cambios) => Object.assign(comercios.find((c) => c.id === id), cambios),
    movimientoPorTx: async (h) => { const m = movimientos.find((x) => x.tx_hash === h); return m ? conComercio(m) : null },
    crearMovimiento: async (d) => { const m = { id: uuid(), ...d }; movimientos.push(m); return conComercio(m) },
    listarMovimientos: async ({ clienteId, comercioId }) =>
      movimientos.filter((m) => (!clienteId || m.cliente_id === clienteId) && (!comercioId || m.comercio_id === comercioId)).map(conComercio),
  }
}

/** Red simulada: cada hash devuelve la invocación que le asignemos. */
function redSimulada(transacciones) {
  return async (hash) => {
    const tx = transacciones[hash]
    if (!tx) throw new ErrorApi(404, 'La transacción todavía no aparece en la red.')
    return { ledger: 123, fecha: '2026-10-17T15:00:00.000Z', retorno: null, ...tx }
  }
}

function montar(transacciones = {}) {
  const repo = repoEnMemoria()
  return { repo, s: crearServicios({ repo, verificarTx: redSimulada(transacciones) }) }
}

// ── Clientes ──
test('registrar cliente nuevo responde 201', async () => {
  const { s, repo } = montar()
  const r = await s.registrarCliente({ nombre: ' Andrés ', celular: '310 987 6543' })
  assert.equal(r.status, 201)
  assert.equal(r.datos.cliente.celular, '3109876543')
  assert.equal(r.datos.cliente.nombre, 'Andrés')
  assert.equal(repo.clientes.length, 2)
})

test('registrar un celular que ya existe devuelve el mismo cliente', async () => {
  const { s, repo } = montar()
  const r = await s.registrarCliente({ nombre: 'Otra', celular: '3001234567' })
  assert.equal(r.yaExistia, true)
  assert.equal(r.cliente.clienteId, CAMILA)
  assert.equal(repo.clientes.length, 1)
})

test('celular inválido o nombre vacío dan 400', async () => {
  const { s } = montar()
  await assert.rejects(() => s.registrarCliente({ nombre: 'Ana', celular: '123' }), { status: 400 })
  await assert.rejects(() => s.registrarCliente({ nombre: '', celular: '3001112233' }), { status: 400 })
})

test('buscar cliente por celular, por código QR y por cliente_id', async () => {
  const { s, repo } = montar()
  const id = repo.clientes[0].id
  assert.equal((await s.buscarCliente('3001234567')).cliente.id, id)
  assert.equal((await s.buscarCliente(id)).cliente.id, id)
  assert.equal((await s.buscarCliente(CAMILA)).cliente.id, id)
  await assert.rejects(() => s.buscarCliente('3000000000'), { status: 404 })
  await assert.rejects(() => s.buscarCliente('hola'), { status: 400 })
})

// ── Movimientos ──
test('una entrega se indexa con los datos que vienen de la red', async () => {
  const { s } = montar({ [TX(1)]: { funcion: 'emitir_puntos', args: [ROSA, CAMILA, 25500], retorno: 25 } })
  const r = await s.registrarMovimiento({ txHash: TX(1) })
  assert.equal(r.status, 201)
  assert.deepEqual(
    { tipo: r.datos.movimiento.tipo, puntos: r.datos.movimiento.puntos, valor: r.datos.movimiento.valorCompra, comercio: r.datos.movimiento.comercio },
    { tipo: 'entrega', puntos: 25, valor: 25500, comercio: 'Tienda Doña Rosa' },
  )
})

test('una redención en otra tienda se indexa', async () => {
  const { s } = montar({ [TX(2)]: { funcion: 'redimir', args: [PANADERIA, CAMILA, 10], retorno: 15 } })
  const r = await s.registrarMovimiento({ txHash: TX(2) })
  assert.equal(r.datos.movimiento.tipo, 'redencion')
  assert.equal(r.datos.movimiento.puntos, 10)
  assert.equal(r.datos.movimiento.comercio, 'Panadería El Trigal')
})

test('mandar el mismo hash dos veces no duplica el movimiento', async () => {
  const { s, repo } = montar({ [TX(1)]: { funcion: 'emitir_puntos', args: [ROSA, CAMILA, 5000], retorno: 5 } })
  await s.registrarMovimiento({ txHash: TX(1) })
  const r = await s.registrarMovimiento({ txHash: TX(1) })
  assert.equal(r.yaExistia, true)
  assert.equal(repo.movimientos.length, 1)
})

test('no se indexa una transacción de otra función, de un comercio desconocido o de un cliente sin registro', async () => {
  const { s } = montar({
    [TX(3)]: { funcion: 'registrar_comercio', args: [ROSA, 100] },
    [TX(4)]: { funcion: 'emitir_puntos', args: ['G' + 'Z'.repeat(55), CAMILA, 5000], retorno: 5 },
    [TX(5)]: { funcion: 'emitir_puntos', args: [ROSA, 'e'.repeat(64), 5000], retorno: 5 },
  })
  await assert.rejects(() => s.registrarMovimiento({ txHash: TX(3) }), { status: 422 })
  await assert.rejects(() => s.registrarMovimiento({ txHash: TX(4) }), { status: 422 })
  await assert.rejects(() => s.registrarMovimiento({ txHash: TX(5) }), { status: 422 })
  await assert.rejects(() => s.registrarMovimiento({ txHash: TX(6) }), { status: 404 })
})

test('historial por cliente y por comercio', async () => {
  const { s, repo } = montar({
    [TX(1)]: { funcion: 'emitir_puntos', args: [ROSA, CAMILA, 25500], retorno: 25 },
    [TX(2)]: { funcion: 'redimir', args: [PANADERIA, CAMILA, 10], retorno: 15 },
  })
  await s.registrarMovimiento({ txHash: TX(1) })
  await s.registrarMovimiento({ txHash: TX(2) })
  assert.equal((await s.listarMovimientos({ clienteId: CAMILA })).movimientos.length, 2)
  assert.equal((await s.listarMovimientos({ comercioId: repo.comercios[1].id })).movimientos.length, 1)
  await assert.rejects(() => s.listarMovimientos({}), { status: 400 })
})

// ── Comercios ──
test('una solicitud queda pendiente y luego se aprueba con la transacción del admin', async () => {
  const NUEVA = 'G' + 'C'.repeat(55)
  const { s } = montar({ [TX(7)]: { funcion: 'registrar_comercio', args: [NUEVA, 1500] } })
  const sol = await s.solicitarComercio({ nombre: 'Frutería Mana', barrio: 'Robledo', cuenta: NUEVA })
  assert.equal(sol.datos.comercio.estado, 'pendiente')
  const r = await s.sincronizarComercio({ id: sol.datos.comercio.id, txHash: TX(7) })
  assert.equal(r.comercio.estado, 'aprobado')
  assert.equal(r.comercio.limiteMensual, 1500)
  assert.equal(r.comercio.cuenta, NUEVA)
})

test('cambiar el límite y desactivar se reflejan desde la red', async () => {
  const { s } = montar({
    [TX(8)]: { funcion: 'registrar_comercio', args: [ROSA, 8000] },
    [TX(9)]: { funcion: 'desactivar_comercio', args: [PANADERIA] },
  })
  assert.equal((await s.sincronizarComercio({ txHash: TX(8) })).comercio.limiteMensual, 8000)
  assert.equal((await s.sincronizarComercio({ txHash: TX(9) })).comercio.estado, 'inactivo')
})

test('no se puede sincronizar una transacción de otra cuenta sobre un comercio', async () => {
  const { s, repo } = montar({ [TX(1)]: { funcion: 'registrar_comercio', args: [PANADERIA, 10] } })
  await assert.rejects(() => s.sincronizarComercio({ id: repo.comercios[0].id, txHash: TX(1) }), { status: 409 })
})

test('rechazar solo aplica a solicitudes pendientes', async () => {
  const { s, repo } = montar()
  assert.equal((await s.rechazarComercio({ id: repo.comercios[2].id })).comercio.estado, 'rechazado')
  await assert.rejects(() => s.rechazarComercio({ id: repo.comercios[0].id }), { status: 409 })
})

test('una cuenta Stellar mal escrita en la solicitud da 400', async () => {
  const { s } = montar()
  await assert.rejects(() => s.solicitarComercio({ nombre: 'X tienda', cuenta: 'GABC' }), { status: 400 })
})

test('un txHash mal formado da 400 antes de tocar la base o la red', async () => {
  const { s } = montar()
  await assert.rejects(() => s.registrarMovimiento({ txHash: 'zz' }), { status: 400 })
  await assert.rejects(() => s.sincronizarComercio({ txHash: '' }), { status: 400 })
})
