// Paso 8: el cliente usa sus puntos en una tienda (puede ser distinta a donde los ganó).
import { useState } from 'react'
import Layout from '../../components/Layout.jsx'
import BuscarCliente from '../../components/BuscarCliente.jsx'
import Comprobante from '../../components/Comprobante.jsx'
import { RequiereComercio } from '../../components/RequiereSesion.jsx'
import { pesos, useStore } from '../../data/store.jsx'

function Contenido() {
  const { comercioActivoId, comercioPorId, reglas, redimirPuntos, saldoDe } = useStore()
  const comercio = comercioPorId(comercioActivoId)
  const [cliente, setCliente] = useState(null)
  const [puntos, setPuntos] = useState('')
  const [aceptado, setAceptado] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const n = Number(puntos) || 0
  const saldo = cliente ? saldoDe(cliente.id) : 0

  function confirmar() {
    setError('')
    setEnviando(true)
    setTimeout(() => {
      const r = redimirPuntos(comercio.id, cliente.id, n)
      setEnviando(false)
      if (!r.ok) setError(r.error)
      else setResultado(r.movimiento)
    }, 1400)
  }

  function reiniciar() {
    setCliente(null)
    setPuntos('')
    setAceptado(false)
    setResultado(null)
  }

  return (
    <Layout rol="tendero" subtitulo={comercio.nombre}>
      <h1 className="titulo">Redimir puntos</h1>
      <p className="bajada">Cada punto vale {pesos(reglas.descuentoPorPunto)} de descuento, sin importar en qué tienda se ganó.</p>

      {resultado ? (
        <Comprobante movimiento={resultado} cliente={cliente} comercio={comercio} onNuevo={reiniciar} />
      ) : !cliente ? (
        <BuscarCliente onEncontrado={setCliente} />
      ) : (
        <div className="formulario">
          <div className="cliente-elegido">
            <span>Cliente</span>
            <strong>{cliente.nombre}</strong>
            <span className="saldo-pill">{saldo} puntos</span>
            <button type="button" className="enlace-discreto" onClick={() => setCliente(null)}>
              Cambiar
            </button>
          </div>

          <label htmlFor="puntos">Puntos a usar</label>
          <input
            id="puntos"
            inputMode="numeric"
            placeholder="10"
            value={puntos}
            onChange={(e) => {
              setPuntos(e.target.value.replace(/\D/g, ''))
              setAceptado(false)
            }}
            autoFocus
          />
          <p className="calculo" aria-live="polite">
            {n > 0 ? (
              <>
                Descuento para el cliente: <strong>{pesos(n * reglas.descuentoPorPunto)}</strong>
              </>
            ) : (
              'Escribe cuántos puntos quiere usar.'
            )}
          </p>

          {n > 0 && (
            <label className="check">
              <input type="checkbox" checked={aceptado} onChange={(e) => setAceptado(e.target.checked)} />
              <span>El cliente confirmó en su celular que quiere usar {n} puntos</span>
            </label>
          )}

          {error && <p className="error">{error}</p>}
          <button className="boton boton-grande boton-rojo" type="button" disabled={n <= 0 || !aceptado || enviando} onClick={confirmar}>
            {enviando ? 'Registrando en la red…' : `Redimir ${n || ''} puntos`}
          </button>
        </div>
      )}
    </Layout>
  )
}

export default function Redimir() {
  return (
    <RequiereComercio>
      <Contenido />
    </RequiereComercio>
  )
}
