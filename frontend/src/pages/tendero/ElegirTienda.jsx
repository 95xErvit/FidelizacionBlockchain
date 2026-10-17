// Paso 2: el tendero entra con la wallet de su tienda.
// Si la cuenta no es un comercio todavía, puede pedir entrar a la red.
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { BotonConectar } from '../../components/RequiereSesion.jsx'
import { cortar } from '../../config/stellar.js'
import { useStore } from '../../data/store.jsx'
import { api } from '../../lib/api.js'

function Solicitud() {
  const { wallet, recargarComercios } = useStore()
  const [form, setForm] = useState({ nombre: '', barrio: '', responsable: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await api.solicitarComercio({ ...form, cuenta: wallet })
      await recargarComercios()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <p className="bajada">
        Esta cuenta (<span className="codigo">{cortar(wallet, 6)}</span>) todavía no es una tienda de la red. Llena
        los datos y el administrador revisará tu solicitud.
      </p>
      <label htmlFor="n">Nombre de la tienda</label>
      <input id="n" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      <label htmlFor="b">Barrio</label>
      <input id="b" value={form.barrio} onChange={(e) => setForm({ ...form, barrio: e.target.value })} />
      <label htmlFor="r">Responsable</label>
      <input id="r" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
      {error && <p className="error">{error}</p>}
      <button className="boton boton-grande" type="submit" disabled={enviando || form.nombre.trim().length < 2}>
        {enviando ? 'Enviando…' : 'Pedir entrar a la red'}
      </button>
    </form>
  )
}

export default function ElegirTienda() {
  const { wallet, comercioDeWallet: comercio, cargandoComercios, errorRed } = useStore()

  if (wallet && comercio?.estado === 'aprobado') return <Navigate to="/tendero/entregar" replace />

  return (
    <Layout rol="tendero" sinMenu>
      <h1 className="titulo">Entra con la wallet de tu tienda</h1>
      <p className="bajada">
        Cada tienda tiene una cuenta en Stellar. Tu wallet (por ejemplo Freighter) firma las entregas y las
        redenciones; la app nunca ve tu llave privada.
      </p>
      {errorRed && <p className="error">{errorRed}</p>}

      {!wallet ? (
        <>
          <BotonConectar texto="Conectar wallet de la tienda" />
          <div className="caja-aprende">
            <p>
              <strong>¿Primera vez?</strong> Instala Freighter, crea o importa una cuenta y en{' '}
              <em>Settings → Network</em> elige <strong>Testnet</strong>.
            </p>
          </div>
        </>
      ) : cargandoComercios ? (
        <p className="vacio">Buscando tu tienda…</p>
      ) : !comercio ? (
        <Solicitud />
      ) : comercio.estado === 'pendiente' ? (
        <p className="estado-caja">
          <span className="estado estado-pendiente">En revisión</span> La solicitud de <strong>{comercio.nombre}</strong>{' '}
          está esperando la aprobación del administrador.
        </p>
      ) : (
        <p className="estado-caja">
          <span className={`estado estado-${comercio.estado}`}>{comercio.estado === 'inactivo' ? 'Desactivada' : 'Rechazada'}</span>{' '}
          <strong>{comercio.nombre}</strong> no puede operar en la red. Habla con el administrador.
        </p>
      )}
    </Layout>
  )
}
