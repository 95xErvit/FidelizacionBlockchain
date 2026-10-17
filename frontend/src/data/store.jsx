// "Cerebro" del front. Ya no hay datos simulados:
// - comercios, clientes e historial vienen de la API (/api → Supabase)
// - saldos, reglas y límites vienen del contrato en testnet
// - la sesión del tendero/admin es su wallet; la del cliente, su celular
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { leerAdmin, leerReglas } from '../lib/contrato.js'
import { conectarWallet, desconectarWallet, restaurarWallet } from '../lib/wallet.js'

const CLAVE_CLIENTE = 'puntos-barrio-cliente-v2'
const StoreContext = createContext(null)

function leerClienteGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CLIENTE)) || null
  } catch {
    return null
  }
}

export function StoreProvider({ children }) {
  const [cliente, setCliente] = useState(leerClienteGuardado)
  const [wallet, setWallet] = useState(null)
  const [comercios, setComercios] = useState([])
  const [cargandoComercios, setCargandoComercios] = useState(true)
  const [errorRed, setErrorRed] = useState('')
  const [reglas, setReglas] = useState({ pesosPorPunto: 1000, diasVencimiento: 180 })
  const [admin, setAdmin] = useState(null)

  const recargarComercios = useCallback(async () => {
    try {
      const { comercios } = await api.comercios()
      setComercios(comercios)
      setErrorRed('')
    } catch (e) {
      setErrorRed(`No pudimos cargar los comercios: ${e.message}`)
    } finally {
      setCargandoComercios(false)
    }
  }, [])

  // Al abrir la app: comercios (API), reglas y admin (contrato) y la wallet guardada.
  useEffect(() => {
    recargarComercios()
    leerReglas()
      .then((r) => r && setReglas({ pesosPorPunto: r.pesos_por_punto, diasVencimiento: r.dias_vencimiento }))
      .catch(() => {})
    leerAdmin().then(setAdmin).catch(() => {})
    restaurarWallet().then((g) => g && setWallet(g))
  }, [recargarComercios])

  useEffect(() => {
    try {
      if (cliente) localStorage.setItem(CLAVE_CLIENTE, JSON.stringify(cliente))
      else localStorage.removeItem(CLAVE_CLIENTE)
    } catch {
      /* sin almacenamiento: la sesión dura lo que dure la pestaña */
    }
  }, [cliente])

  const conectar = useCallback(async () => {
    const g = await conectarWallet()
    setWallet(g)
    return g
  }, [])

  const desconectar = useCallback(async () => {
    try {
      await desconectarWallet()
    } finally {
      setWallet(null)
    }
  }, [])

  const valor = useMemo(
    () => ({
      // sesión cliente
      cliente,
      iniciarCliente: setCliente,
      salirCliente: () => setCliente(null),
      // wallet (tendero / admin)
      wallet,
      conectar,
      desconectar,
      esAdmin: Boolean(wallet && admin && wallet === admin),
      admin,
      // red
      comercios,
      cargandoComercios,
      errorRed,
      recargarComercios,
      comercioDeWallet: wallet ? comercios.find((c) => c.cuenta === wallet) || null : null,
      reglas,
    }),
    [cliente, wallet, conectar, desconectar, admin, comercios, cargandoComercios, errorRed, recargarComercios, reglas],
  )

  return <StoreContext.Provider value={valor}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}

// Utilidades de formato compartidas
export const pesos = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`
export const fechaCorta = (iso) =>
  new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
