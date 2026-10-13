// Paso 5: el tendero escanea el código, digita el valor de la compra y confirma.
import { useState } from 'react'
import Layout from '../../components/Layout.jsx'
import BuscarCliente from '../../components/BuscarCliente.jsx'
import Comprobante from '../../components/Comprobante.jsx'
import { RequiereComercio } from '../../components/RequiereSesion.jsx'
import { pesos, useStore } from '../../data/store.jsx'

function Contenido() {
  const { comercioActivoId, comercioPorId, reglas, entregarPuntos, emitidosEsteMes } = useStore()
  const comercio = comercioPorId(comercioActivoId)
  const [cliente, setCliente] = useState(null)
  const [valor, setValor] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const valorNum = Number(valor.replace(/\D/g, '')) || 0
  const puntos = Math.floor(valorNum / reglas.pesosPorPunto)
  const disponible = comercio.limiteMensual - emitidosEsteMes(comercio.id)

  function confirmar() {
    setError('')
    setEnviando(true)
    // Simula los ~5 segundos que tarda la red en cerrar un ledger.
    setTimeout(() => {
      const r = entregarPuntos(comercio.id, cliente.id, valorNum)
      setEnviando(false)
      if (!r.ok) setError(r.error)
      else setResultado(r.movimiento)
    }, 1400)
  }

  function reiniciar() {
    setCliente(null)
    setValor('')
    setResultado(null)
  }

  return (
    <Layout rol="tendero" subtitulo={comercio.nombre}>
      <h1 className="titulo">Entregar puntos</h1>
      <p className="bajada">
        Regla de la red: 1 punto por cada {pesos(reglas.pesosPorPunto)} de compra. Te quedan{' '}
        <strong>{disponible.toLocaleString('es-CO')}</strong> puntos por entregar este mes.
      </p>

      {resultado ? (
        <Comprobante movimiento={resultado} cliente={cliente} comercio={comercio} onNuevo={reiniciar} />
      ) : !cliente ? (
        <BuscarCliente onEncontrado={setCliente} />
      ) : (
        <div className="formulario">
          <div className="cliente-elegido">
            <span>Cliente</span>
            <strong>{cliente.nombre}</strong>
            <button type="button" className="enlace-discreto" onClick={() => setCliente(null)}>
              Cambiar
            </button>
          </div>

          <label htmlFor="valor">Valor de la compra</label>
          <input
            id="valor"
            inputMode="numeric"
            placeholder="25000"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            autoFocus
          />
          <p className="calculo" aria-live="polite">
            {valorNum > 0 ? (
              <>
                {pesos(valorNum)} = <strong>{puntos} puntos</strong>
              </>
            ) : (
              'Escribe el valor para calcular los puntos.'
            )}
          </p>

          {error && <p className="error">{error}</p>}
          <button className="boton boton-grande" type="button" disabled={puntos <= 0 || enviando} onClick={confirmar}>
            {enviando ? 'Registrando en la red…' : `Entregar ${puntos} puntos`}
          </button>
        </div>
      )}
    </Layout>
  )
}

export default function Entregar() {
  return (
    <RequiereComercio>
      <Contenido />
    </RequiereComercio>
  )
}
