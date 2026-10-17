// Lógica del backend, sin HTTP ni base de datos concreta: recibe el repositorio
// y el verificador de transacciones, así se puede probar con datos falsos.
import { ErrorApi } from './http.js'

const RE_CELULAR = /^[0-9]{10}$/
const RE_HEX64 = /^[0-9a-f]{64}$/
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const RE_CUENTA = /^G[A-Z2-7]{55}$/

const limpiar = (texto) => String(texto ?? '').trim()

/** Forma pública de un movimiento (lo que ve el front). */
function presentarMovimiento(m) {
  return {
    id: m.id,
    tipo: m.tipo,
    clienteId: m.cliente_id,
    comercioId: m.comercio_id,
    comercio: m.comercios?.nombre ?? null,
    puntos: m.puntos,
    valorCompra: m.valor_compra,
    txHash: m.tx_hash,
    ledger: m.ledger,
    fecha: m.creado_en,
  }
}

const presentarCliente = (c) => ({ id: c.id, nombre: c.nombre, celular: c.celular, clienteId: c.cliente_id })

const presentarComercio = (c) => ({
  id: c.id,
  nombre: c.nombre,
  barrio: c.barrio,
  responsable: c.responsable,
  cuenta: c.cuenta_stellar,
  estado: c.estado,
  limiteMensual: c.limite_mensual,
})

export function crearServicios({ repo, verificarTx }) {
  return {
    // ── Clientes ───────────────────────────────────────────────────────
    async registrarCliente({ nombre, celular }) {
      nombre = limpiar(nombre)
      celular = limpiar(celular).replace(/\D/g, '')
      if (nombre.length < 2) throw new ErrorApi(400, 'Escribe tu nombre.')
      if (!RE_CELULAR.test(celular)) throw new ErrorApi(400, 'El celular debe tener 10 dígitos.')
      const existente = await repo.clientePorCelular(celular)
      if (existente) return { cliente: presentarCliente(existente), yaExistia: true }
      const nuevo = await repo.crearCliente({ nombre, celular })
      return { status: 201, datos: { cliente: presentarCliente(nuevo), yaExistia: false } }
    },

    /** Busca por celular, por código del QR (id) o por cliente_id del contrato. */
    async buscarCliente(texto) {
      const t = limpiar(texto).toLowerCase()
      let cliente = null
      if (RE_UUID.test(t)) cliente = await repo.clientePorId(t)
      else if (RE_HEX64.test(t)) cliente = await repo.clientePorClienteId(t)
      else if (RE_CELULAR.test(t.replace(/[\s()+-]/g, ''))) cliente = await repo.clientePorCelular(t.replace(/[\s()+-]/g, ''))
      else throw new ErrorApi(400, 'Busca por celular (10 dígitos) o por el código del cliente.')
      if (!cliente) throw new ErrorApi(404, 'No encontramos un cliente con ese dato.')
      return { cliente: presentarCliente(cliente) }
    },

    // ── Comercios ──────────────────────────────────────────────────────
    async listarComercios() {
      return { comercios: (await repo.listarComercios()).map(presentarComercio) }
    },

    /** Un tendero pide entrar a la red (queda pendiente hasta que el admin firme). */
    async solicitarComercio({ nombre, barrio, responsable, cuenta }) {
      nombre = limpiar(nombre)
      cuenta = limpiar(cuenta) || null
      if (nombre.length < 2) throw new ErrorApi(400, 'Escribe el nombre del comercio.')
      if (cuenta && !RE_CUENTA.test(cuenta)) throw new ErrorApi(400, 'La cuenta Stellar no es válida (empieza por G).')
      if (cuenta && (await repo.comercioPorCuenta(cuenta))) throw new ErrorApi(409, 'Esa cuenta ya pertenece a un comercio.')
      const nuevo = await repo.crearComercio({
        nombre,
        barrio: limpiar(barrio) || null,
        responsable: limpiar(responsable) || null,
        cuenta_stellar: cuenta,
        estado: 'pendiente',
      })
      return { status: 201, datos: { comercio: presentarComercio(nuevo) } }
    },

    /**
     * Después de que el admin firma registrar_comercio / desactivar_comercio,
     * el front manda el hash y aquí se refleja en la base lo que quedó en la red.
     */
    async sincronizarComercio({ id, txHash }) {
      txHash = limpiar(txHash).toLowerCase()
      if (!RE_HEX64.test(txHash)) throw new ErrorApi(400, 'txHash inválido (deben ser 64 caracteres hexadecimales).')
      const tx = await verificarTx(txHash)
      const [cuenta, limite] = tx.args
      let comercio = id ? await repo.comercioPorId(id) : await repo.comercioPorCuenta(cuenta)
      if (!comercio) throw new ErrorApi(404, 'No hay un comercio con ese id o esa cuenta.')
      if (comercio.cuenta_stellar && comercio.cuenta_stellar !== cuenta) {
        throw new ErrorApi(409, 'La transacción es de otra cuenta, no de este comercio.')
      }
      let cambios
      if (tx.funcion === 'registrar_comercio') cambios = { cuenta_stellar: cuenta, estado: 'aprobado', limite_mensual: limite }
      else if (tx.funcion === 'desactivar_comercio') cambios = { cuenta_stellar: cuenta, estado: 'inactivo' }
      else throw new ErrorApi(422, `La transacción es "${tx.funcion}", no un registro de comercio.`)
      comercio = await repo.actualizarComercio(comercio.id, cambios)
      return { comercio: presentarComercio(comercio), txHash }
    },

    /** Rechazar una solicitud no toca la red (el comercio nunca entró). */
    async rechazarComercio({ id }) {
      const comercio = await repo.comercioPorId(limpiar(id))
      if (!comercio) throw new ErrorApi(404, 'Comercio no encontrado.')
      if (comercio.estado !== 'pendiente') throw new ErrorApi(409, 'Solo se pueden rechazar solicitudes pendientes.')
      return { comercio: presentarComercio(await repo.actualizarComercio(comercio.id, { estado: 'rechazado' })) }
    },

    // ── Movimientos ────────────────────────────────────────────────────
    /**
     * Guarda en el historial una entrega o redención que YA ocurrió en la red.
     * Solo recibe el hash: tipo, comercio, cliente y puntos salen de la red.
     */
    async registrarMovimiento({ txHash }) {
      txHash = limpiar(txHash).toLowerCase()
      if (!RE_HEX64.test(txHash)) throw new ErrorApi(400, 'txHash inválido (deben ser 64 caracteres hexadecimales).')
      const previo = await repo.movimientoPorTx(txHash)
      if (previo) return { movimiento: presentarMovimiento(previo), yaExistia: true }

      const tx = await verificarTx(txHash)
      let datos
      if (tx.funcion === 'emitir_puntos') {
        const [cuenta, clienteId, valorCompra] = tx.args
        datos = { tipo: 'entrega', cuenta, clienteId, puntos: tx.retorno, valor_compra: valorCompra }
      } else if (tx.funcion === 'redimir') {
        const [cuenta, clienteId, puntos] = tx.args
        datos = { tipo: 'redencion', cuenta, clienteId, puntos, valor_compra: null }
      } else {
        throw new ErrorApi(422, `La transacción es "${tx.funcion}", no una entrega ni una redención.`)
      }

      const comercio = await repo.comercioPorCuenta(datos.cuenta)
      if (!comercio) throw new ErrorApi(422, 'La cuenta que firmó no está asociada a ningún comercio en la base.')
      const cliente = await repo.clientePorClienteId(datos.clienteId)
      if (!cliente) throw new ErrorApi(422, 'El cliente de la transacción no está registrado.')

      const movimiento = await repo.crearMovimiento({
        tipo: datos.tipo,
        cliente_id: datos.clienteId,
        comercio_id: comercio.id,
        puntos: datos.puntos,
        valor_compra: datos.valor_compra,
        tx_hash: txHash,
        ledger: tx.ledger,
        creado_en: tx.fecha,
      })
      return { status: 201, datos: { movimiento: presentarMovimiento(movimiento), yaExistia: false } }
    },

    async listarMovimientos({ clienteId, comercioId }) {
      clienteId = limpiar(clienteId).toLowerCase() || undefined
      comercioId = limpiar(comercioId).toLowerCase() || undefined
      if (!clienteId && !comercioId) throw new ErrorApi(400, 'Indica clienteId o comercioId.')
      if (clienteId && !RE_HEX64.test(clienteId)) throw new ErrorApi(400, 'clienteId inválido.')
      if (comercioId && !RE_UUID.test(comercioId)) throw new ErrorApi(400, 'comercioId inválido.')
      const lista = await repo.listarMovimientos({ clienteId, comercioId })
      return { movimientos: lista.map(presentarMovimiento) }
    },
  }
}
