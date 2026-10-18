// Protege las pantallas de cada rol.
// - Cliente: necesita haberse registrado (celular).
// - Tienda: necesita una wallet conectada que sea un comercio APROBADO.
// - Admin: necesita la wallet del administrador del contrato.
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { cortar } from '../config/stellar.js'
import { useStore } from '../data/store.jsx'
import Layout from './Layout.jsx'

export function RequiereCliente({ children }) {
  const { cliente } = useStore()
  if (!cliente) return <Navigate to="/cliente/registro" replace />
  return children
}

export function RequiereComercio({ children }) {
  const { wallet, comercioDeWallet, cargandoComercios } = useStore()
  if (cargandoComercios) return <Layout rol="tendero" sinMenu><p className="vacio">Cargando…</p></Layout>
  if (!wallet || comercioDeWallet?.estado !== 'aprobado') return <Navigate to="/tendero" replace />
  return children
}

/** Botón de conectar wallet con manejo de error (lo usan tienda y admin). */
export function BotonConectar({ texto = 'Conectar wallet' }) {
  const { conectar } = useStore()
  const [error, setError] = useState('')
  const [abriendo, setAbriendo] = useState(false)
  return (
    <>
      <button
        type="button"
        className="boton boton-grande"
        disabled={abriendo}
        onClick={async () => {
          setError('')
          setAbriendo(true)
          try {
            await conectar()
          } catch (e) {
            if (!/closed|cancel/i.test(e?.message || '')) setError(e?.message || 'No se pudo conectar la wallet.')
          } finally {
            setAbriendo(false)
          }
        }}
      >
        {abriendo ? 'Abriendo wallet…' : texto}
      </button>
      {error && <p className="error">{error}</p>}
    </>
  )
}

export function RequiereAdmin({ children }) {
  const { wallet, esAdmin, admin } = useStore()
  if (esAdmin) return children
  return (
    <Layout rol="admin" sinMenu>
      <h1 className="titulo">Panel del administrador</h1>
      <p className="bajada">
        Aprobar comercios y cambiar límites son operaciones que firma el administrador del contrato
        {admin ? <> (<span className="codigo">{cortar(admin, 6)}</span>)</> : null}.
      </p>
      {wallet ? (
        <p className="error">
          La wallet conectada (<span className="codigo">{cortar(wallet, 6)}</span>) no es la del administrador. Cambia de
          cuenta en tu wallet y vuelve a conectar.
        </p>
      ) : null}
      <BotonConectar texto={wallet ? 'Conectar otra cuenta' : 'Conectar wallet del administrador'} />
    </Layout>
  )
}
