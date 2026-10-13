// "Cerebro" del front: guarda comercios, clientes y movimientos en memoria
// (y en el navegador para que no se pierdan al recargar).
// Cada acción que escribe en la red (entregar y redimir) está marcada con
// "STELLAR (semana 4)": ahí es donde irá la transacción real.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  REGLAS,
  clientesIniciales,
  comerciosIniciales,
  movimientosIniciales,
} from './mockData.js'

const CLAVE = 'puntos-barrio-v1'
const StoreContext = createContext(null)

function estadoInicial() {
  return {
    comercios: comerciosIniciales,
    clientes: clientesIniciales,
    movimientos: movimientosIniciales,
    clienteActivoId: null, // quién usa la app de cliente
    comercioActivoId: null, // qué tienda usa la app de tendero
  }
}

function cargar() {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado) return JSON.parse(guardado)
  } catch {
    /* sin almacenamiento: seguimos con los datos de prueba */
  }
  return estadoInicial()
}

// Simula el hash que devuelve Stellar cuando confirma una transacción.
function hashFalso() {
  const hex = '0123456789abcdef'
  let h = ''
  for (let i = 0; i < 64; i++) h += hex[Math.floor(Math.random() * 16)]
  return h
}

function cuentaFalsa(prefijo) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ234567'
  let fin = ''
  for (let i = 0; i < 4; i++) fin += abc[Math.floor(Math.random() * abc.length)]
  return `G${prefijo.slice(0, 3).toUpperCase()}…${fin}`
}

function siglas(nombre) {
  return nombre
    .split(' ')
    .filter((p) => p.length > 2)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function StoreProvider({ children }) {
  const [estado, setEstado] = useState(cargar)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado))
    } catch {
      /* ignorar */
    }
  }, [estado])

  const api = useMemo(() => {
    const { comercios, clientes, movimientos } = estado

    const saldoDe = (clienteId) =>
      movimientos
        .filter((m) => m.clienteId === clienteId)
        .reduce((s, m) => s + (m.tipo === 'entrega' ? m.puntos : -m.puntos), 0)

    const emitidosEsteMes = (comercioId) => {
      const ahora = new Date()
      return movimientos
        .filter((m) => {
          const f = new Date(m.fecha)
          return (
            m.comercioId === comercioId &&
            m.tipo === 'entrega' &&
            f.getMonth() === ahora.getMonth() &&
            f.getFullYear() === ahora.getFullYear()
          )
        })
        .reduce((s, m) => s + m.puntos, 0)
    }

    const buscarCliente = (texto) => {
      const t = texto.trim()
      return clientes.find((c) => c.celular === t || c.id === t) || null
    }

    const nuevoMemo = (tipo, comercio) => {
      const prefijo = tipo === 'entrega' ? 'ENT' : 'RED'
      const n = movimientos.filter((m) => m.comercioId === comercio.id && m.tipo === tipo).length + 1
      return `${prefijo}-${siglas(comercio.nombre)}-${String(n).padStart(4, '0')}`
    }

    return {
      ...estado,
      reglas: REGLAS,
      saldoDe,
      emitidosEsteMes,
      buscarCliente,
      comercioPorId: (id) => comercios.find((c) => c.id === id),
      clientePorId: (id) => clientes.find((c) => c.id === id),

      // Paso 3 del flujo: el cliente se registra con su celular.
      // STELLAR (semana 4): crear cuenta con reserva patrocinada + trustline autorizada.
      registrarCliente(nombre, celular) {
        const existe = clientes.find((c) => c.celular === celular)
        if (existe) {
          setEstado((e) => ({ ...e, clienteActivoId: existe.id }))
          return { ok: true, cliente: existe, yaExistia: true }
        }
        const cliente = { id: `c${Date.now()}`, nombre, celular, cuenta: cuentaFalsa(nombre) }
        setEstado((e) => ({ ...e, clientes: [...e.clientes, cliente], clienteActivoId: cliente.id }))
        return { ok: true, cliente, yaExistia: false }
      },

      salirCliente() {
        setEstado((e) => ({ ...e, clienteActivoId: null }))
      },

      elegirComercio(id) {
        setEstado((e) => ({ ...e, comercioActivoId: id }))
      },

      // Paso 5: el tendero entrega puntos por una compra.
      // STELLAR (semana 4): pago del activo PUNTOS desde la distribuidora al cliente, con memo.
      entregarPuntos(comercioId, clienteId, valorCompra) {
        const comercio = comercios.find((c) => c.id === comercioId)
        const puntos = Math.floor(valorCompra / REGLAS.pesosPorPunto)
        if (puntos <= 0) {
          return { ok: false, error: `La compra mínima para ganar un punto es $${REGLAS.pesosPorPunto.toLocaleString('es-CO')}.` }
        }
        const disponible = comercio.limiteMensual - emitidosEsteMes(comercioId)
        if (puntos > disponible) {
          return { ok: false, error: `Esta tienda solo puede entregar ${disponible} puntos más este mes. Pídele al administrador que suba el límite.` }
        }
        const mov = {
          id: `t${Date.now()}`,
          tipo: 'entrega',
          clienteId,
          comercioId,
          puntos,
          valorCompra,
          memo: nuevoMemo('entrega', comercio),
          hash: hashFalso(),
          fecha: new Date().toISOString(),
        }
        setEstado((e) => ({ ...e, movimientos: [...e.movimientos, mov] }))
        return { ok: true, movimiento: mov }
      },

      // Paso 8: el cliente redime puntos en otra tienda.
      // STELLAR (semana 4): pago del activo PUNTOS del cliente a la tienda, con memo.
      redimirPuntos(comercioId, clienteId, puntos) {
        const comercio = comercios.find((c) => c.id === comercioId)
        if (puntos <= 0) return { ok: false, error: 'Escribe cuántos puntos quiere usar el cliente.' }
        const saldo = saldoDe(clienteId)
        if (puntos > saldo) return { ok: false, error: `El cliente tiene ${saldo} puntos; no alcanza para redimir ${puntos}.` }
        const mov = {
          id: `t${Date.now()}`,
          tipo: 'redencion',
          clienteId,
          comercioId,
          puntos,
          valorCompra: null,
          memo: nuevoMemo('redencion', comercio),
          hash: hashFalso(),
          fecha: new Date().toISOString(),
        }
        setEstado((e) => ({ ...e, movimientos: [...e.movimientos, mov] }))
        return { ok: true, movimiento: mov }
      },

      // Paso 1: el administrador aprueba un comercio.
      // STELLAR (semana 4): crear la cuenta del comercio y autorizar su trustline.
      aprobarComercio(id) {
        setEstado((e) => ({
          ...e,
          comercios: e.comercios.map((c) =>
            c.id === id ? { ...c, estado: 'aprobado', cuenta: c.cuenta || cuentaFalsa(c.nombre) } : c,
          ),
        }))
      },

      rechazarComercio(id) {
        setEstado((e) => ({
          ...e,
          comercios: e.comercios.map((c) => (c.id === id ? { ...c, estado: 'rechazado' } : c)),
        }))
      },

      solicitarComercio(datos) {
        const nuevo = { id: `m${Date.now()}`, estado: 'pendiente', limiteMensual: 2000, cuenta: null, ...datos }
        setEstado((e) => ({ ...e, comercios: [...e.comercios, nuevo] }))
      },

      // Paso 10: el administrador ajusta el límite de emisión (lo aplica el servidor, no un contrato).
      cambiarLimite(id, limite) {
        setEstado((e) => ({
          ...e,
          comercios: e.comercios.map((c) => (c.id === id ? { ...c, limiteMensual: limite } : c)),
        }))
      },

      reiniciarDemo() {
        setEstado(estadoInicial())
      },
    }
  }, [estado])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}

// Utilidades de formato compartidas
export const pesos = (n) => `$${Number(n).toLocaleString('es-CO')}`
export const fechaCorta = (iso) =>
  new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
