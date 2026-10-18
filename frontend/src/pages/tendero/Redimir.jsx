// Paso 8: el cliente usa sus puntos en una tienda (puede ser distinta a donde los ganó).
import { useState } from 'react'
import Layout from '../../components/Layout.jsx'
import BuscarCliente from '../../components/BuscarCliente.jsx'
import Comprobante from '../../components/Comprobante.jsx'
import EstadoTx from '../../components/EstadoTx.jsx'
import { RequiereComercio } from '../../components/RequiereSesion.jsx'
import { DESCUENTO_POR_PUNTO } from '../../config/stellar.js'
import { pesos, useStore } from '../../data/store.jsx'
import { useCarga } from '../../hooks/useCarga.js'
import { ocupado, useTx } from '../../hooks/useTx.js'
import { api } from '../../lib/api.js'
import { leerSaldo, redimirPuntos } from '../../lib/contrato.js'

function FormularioRedencion({ cliente, onCambiar, onListo }) {
  const { wallet } = useStore()
  const saldo = useCarga(() => leerSaldo(cliente.clienteId), [cliente.clienteId])
  const { tx, ejecutar, reintentar, reiniciar } = useTx()
  const [puntos, setPuntos] = useState('')
  const [aceptado, setAceptado] = useState(false)
  const n = Number(puntos) || 0

  async function confirmar() {
    const r = await ejecutar(async ({ firmar, alPaso }) => {
      const res = await redimirPuntos(wallet, cliente.clienteId, n, { firmar, alPaso })
      alPaso('guardando')
      let aviso = ''
      try {
        await api.registrarMovimiento(res.hash)
      } catch (e) {
        aviso = `La redención quedó en la red, pero no se guardó en el historial (${e.message}).`
      }
      return { hash: res.hash, saldoFinal: res.retorno, puntos: n, aviso }
    })
    if (r) onListo(r)
  }

  return (
    <div className="formulario">
      <div className="cliente-elegido">
        <span>Cliente</span>
        <strong>{cliente.nombre}</strong>
        <span className="saldo-pill">{saldo.cargando ? '…' : saldo.error ? '¿?' : `${saldo.datos} puntos`}</span>
        <button type="button" className="enlace-discreto" disabled={ocupado(tx)} onClick={onCambiar}>
          Cambiar
        </button>
      </div>

      <label htmlFor="puntos">Puntos a usar</label>
      <input
        id="puntos"
        inputMode="numeric"
        placeholder="10"
        value={puntos}
        disabled={ocupado(tx)}
        onChange={(e) => {
          setPuntos(e.target.value.replace(/\D/g, ''))
          setAceptado(false)
          if (tx.estado === 'error') reiniciar() // al corregir el dato, el error anterior ya no aplica
        }}
        autoFocus
      />
      <p className="calculo" aria-live="polite">
        {n > 0 ? (
          <>
            Descuento para el cliente: <strong>{pesos(n * DESCUENTO_POR_PUNTO)}</strong>
            {saldo.datos != null && n > saldo.datos && <span className="error"> · solo tiene {saldo.datos}</span>}
          </>
        ) : (
          'Escribe cuántos puntos quiere usar.'
        )}
      </p>

      {n > 0 && (
        <label className="check">
          <input
            type="checkbox"
            checked={aceptado}
            disabled={ocupado(tx)}
            onChange={(e) => {
              setAceptado(e.target.checked)
              if (tx.estado === 'error') reiniciar()
            }}
          />
          <span>El cliente confirmó que quiere usar {n} puntos</span>
        </label>
      )}

      <EstadoTx tx={tx} onReintentar={reintentar} cuenta={wallet} />
      <button
        className="boton boton-grande boton-rojo"
        type="button"
        disabled={n <= 0 || !aceptado || ocupado(tx)}
        onClick={confirmar}
      >
        {ocupado(tx) ? 'Registrando en la red…' : `Redimir ${n || ''} puntos`}
      </button>
    </div>
  )
}

function Contenido() {
  const { comercioDeWallet: comercio } = useStore()
  const [cliente, setCliente] = useState(null)
  const [resultado, setResultado] = useState(null)

  return (
    <Layout rol="tendero" subtitulo={comercio.nombre}>
      <h1 className="titulo">Redimir puntos</h1>
      <p className="bajada">Cada punto vale {pesos(DESCUENTO_POR_PUNTO)} de descuento, sin importar en qué tienda se ganó.</p>

      {resultado ? (
        <Comprobante
          tipo="redencion"
          puntos={resultado.puntos}
          hash={resultado.hash}
          saldoFinal={resultado.saldoFinal}
          cliente={cliente}
          comercio={comercio}
          avisoHistorial={resultado.aviso}
          onNuevo={() => {
            setCliente(null)
            setResultado(null)
          }}
        />
      ) : !cliente ? (
        <BuscarCliente onEncontrado={setCliente} />
      ) : (
        <FormularioRedencion cliente={cliente} onCambiar={() => setCliente(null)} onListo={setResultado} />
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
