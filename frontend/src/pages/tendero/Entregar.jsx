// Paso 5: el tendero busca al cliente, digita el valor de la compra y firma la entrega.
import { useState } from 'react'
import Layout from '../../components/Layout.jsx'
import BuscarCliente from '../../components/BuscarCliente.jsx'
import Comprobante from '../../components/Comprobante.jsx'
import EstadoTx from '../../components/EstadoTx.jsx'
import { RequiereComercio } from '../../components/RequiereSesion.jsx'
import { pesos, useStore } from '../../data/store.jsx'
import { useCarga } from '../../hooks/useCarga.js'
import { ocupado, useTx } from '../../hooks/useTx.js'
import { api } from '../../lib/api.js'
import { emitirPuntos, leerEmitidosPeriodo } from '../../lib/contrato.js'

function Contenido() {
  const { wallet, comercioDeWallet: comercio, reglas } = useStore()
  const emitidos = useCarga(() => leerEmitidosPeriodo(wallet), [wallet])
  const { tx, ejecutar, reintentar, reiniciar } = useTx()
  const [cliente, setCliente] = useState(null)
  const [valor, setValor] = useState('')

  const valorNum = Number(valor.replace(/\D/g, '')) || 0
  const puntos = Math.floor(valorNum / reglas.pesosPorPunto)
  const disponible = emitidos.datos == null ? null : comercio.limiteMensual - emitidos.datos

  function confirmar() {
    ejecutar(async ({ firmar, alPaso }) => {
      const r = await emitirPuntos(wallet, cliente.clienteId, valorNum, { firmar, alPaso })
      alPaso('guardando')
      let aviso = ''
      try {
        await api.registrarMovimiento(r.hash)
      } catch (e) {
        aviso = `La entrega quedó en la red, pero no se guardó en el historial (${e.message}).`
      }
      emitidos.recargar()
      return { ...r, puntos: r.retorno, aviso }
    })
  }

  function nuevo() {
    setCliente(null)
    setValor('')
    reiniciar()
  }

  return (
    <Layout rol="tendero" subtitulo={comercio.nombre}>
      <h1 className="titulo">Entregar puntos</h1>
      <p className="bajada">
        Regla de la red: 1 punto por cada {pesos(reglas.pesosPorPunto)} de compra. Te quedan{' '}
        <strong>{disponible == null ? '…' : disponible.toLocaleString('es-CO')}</strong> puntos por entregar en este
        periodo de 30 días.
      </p>

      {tx.estado === 'confirmado' ? (
        <Comprobante
          tipo="entrega"
          puntos={tx.resultado.puntos}
          hash={tx.resultado.hash}
          cliente={cliente}
          comercio={comercio}
          avisoHistorial={tx.resultado.aviso}
          onNuevo={nuevo}
        />
      ) : !cliente ? (
        <BuscarCliente onEncontrado={setCliente} />
      ) : (
        <div className="formulario">
          <div className="cliente-elegido">
            <span>Cliente</span>
            <strong>{cliente.nombre}</strong>
            <button
              type="button"
              className="enlace-discreto"
              disabled={ocupado(tx)}
              onClick={() => {
                setCliente(null)
                reiniciar()
              }}
            >
              Cambiar
            </button>
          </div>

          <label htmlFor="valor">Valor de la compra</label>
          <input
            id="valor"
            inputMode="numeric"
            placeholder="25000"
            value={valor}
            disabled={ocupado(tx)}
            onChange={(e) => {
              setValor(e.target.value)
              if (tx.estado === 'error') reiniciar() // al corregir el dato, el error anterior ya no aplica
            }}
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

          <EstadoTx tx={tx} onReintentar={reintentar} cuenta={wallet} />
          <button className="boton boton-grande" type="button" disabled={puntos <= 0 || ocupado(tx)} onClick={confirmar}>
            {ocupado(tx) ? 'Registrando en la red…' : `Entregar ${puntos} puntos`}
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
