// Acceso a la base de datos (Supabase / Postgres).
// Solo el servidor conoce la llave secreta; el navegador nunca habla directo con la base.
import { createClient } from '@supabase/supabase-js'
import { ErrorApi } from './http.js'

let supabase

function db() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL
    const llave = process.env.SUPABASE_SECRET_KEY
    if (!url || !llave) throw new ErrorApi(500, 'Faltan SUPABASE_URL o SUPABASE_SECRET_KEY')
    supabase = createClient(url, llave, { auth: { persistSession: false } })
  }
  return supabase
}

function revisar({ data, error }) {
  if (error) throw error
  return data
}

const COMERCIO = 'id, nombre, barrio, responsable, cuenta_stellar, estado, limite_mensual, creado_en'
const CLIENTE = 'id, nombre, celular, cliente_id, creado_en'
const MOVIMIENTO =
  'id, tipo, cliente_id, comercio_id, puntos, valor_compra, tx_hash, ledger, creado_en, comercios(nombre)'

export const repoSupabase = {
  // ── Clientes ──
  async clientePorCelular(celular) {
    return revisar(await db().from('clientes').select(CLIENTE).eq('celular', celular).maybeSingle())
  },
  async clientePorClienteId(clienteId) {
    return revisar(await db().from('clientes').select(CLIENTE).eq('cliente_id', clienteId).maybeSingle())
  },
  async clientePorId(id) {
    return revisar(await db().from('clientes').select(CLIENTE).eq('id', id).maybeSingle())
  },
  async crearCliente({ nombre, celular }) {
    return revisar(await db().from('clientes').insert({ nombre, celular }).select(CLIENTE).single())
  },

  // ── Comercios ──
  async listarComercios() {
    return revisar(await db().from('comercios').select(COMERCIO).order('creado_en'))
  },
  async comercioPorId(id) {
    return revisar(await db().from('comercios').select(COMERCIO).eq('id', id).maybeSingle())
  },
  async comercioPorCuenta(cuenta) {
    return revisar(await db().from('comercios').select(COMERCIO).eq('cuenta_stellar', cuenta).maybeSingle())
  },
  async crearComercio(datos) {
    return revisar(await db().from('comercios').insert(datos).select(COMERCIO).single())
  },
  async actualizarComercio(id, cambios) {
    return revisar(await db().from('comercios').update(cambios).eq('id', id).select(COMERCIO).single())
  },

  // ── Movimientos ──
  async movimientoPorTx(txHash) {
    return revisar(await db().from('movimientos').select(MOVIMIENTO).eq('tx_hash', txHash).maybeSingle())
  },
  async crearMovimiento(datos) {
    return revisar(await db().from('movimientos').insert(datos).select(MOVIMIENTO).single())
  },
  async listarMovimientos({ clienteId, comercioId, limite = 50 }) {
    let consulta = db().from('movimientos').select(MOVIMIENTO).order('creado_en', { ascending: false }).limit(limite)
    if (clienteId) consulta = consulta.eq('cliente_id', clienteId)
    if (comercioId) consulta = consulta.eq('comercio_id', comercioId)
    return revisar(await consulta)
  },

  // ── Resumen de la red ──
  async contarClientes() {
    const { count, error } = await db().from('clientes').select('id', { count: 'exact', head: true })
    if (error) throw error
    return count ?? 0
  },
  async totalesMovimientos() {
    return revisar(await db().from('movimientos').select('tipo, puntos, comercio_id'))
  },
}
