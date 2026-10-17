// Paso 6: el cliente consulta su saldo (del contrato) y su historial (de la API).
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Tiquete from '../../components/Tiquete.jsx'
import { RequiereCliente } from '../../components/RequiereSesion.jsx'
import { DESCUENTO_POR_PUNTO, enlaceTx } from '../../config/stellar.js'
import { fechaCorta, pesos, useStore } from '../../data/store.jsx'
import { useCarga } from '../../hooks/useCarga.js'
import { api } from '../../lib/api.js'
import { leerSaldo } from '../../lib/contrato.js'

function Contenido() {
  const { cliente, salirCliente, reglas } = useStore()
  const navigate = useNavigate()
  const saldo = useCarga(() => leerSaldo(cliente.clienteId), [cliente.clienteId])
  const historial = useCarga(() => api.movimientosCliente(cliente.clienteId).then((r) => r.movimientos), [cliente.clienteId])
  const puntos = saldo.datos ?? 0

  return (
    <Layout rol="cliente" subtitulo={cliente.nombre}>
      {saldo.error ? (
        <p className="error">No pudimos leer tu saldo en la red: {saldo.error}</p>
      ) : (
        <Tiquete
          puntos={saldo.cargando ? '…' : puntos}
          nombre={`Hola, ${cliente.nombre.split(' ')[0]}`}
          descuento={pesos(puntos * DESCUENTO_POR_PUNTO)}
        />
      )}
      <p className="ayuda">
        Los puntos vencen si pasas {reglas.diasVencimiento} días sin usarlos ni ganar nuevos.{' '}
        <button type="button" className="enlace-discreto" onClick={() => { saldo.recargar(); historial.recargar() }}>
          Actualizar
        </button>
      </p>

      <h2 className="titulo-seccion">Tu historial</h2>
      {historial.cargando ? (
        <p className="vacio">Cargando…</p>
      ) : historial.error ? (
        <p className="error">{historial.error}</p>
      ) : historial.datos.length === 0 ? (
        <p className="vacio">Todavía no tienes movimientos. Muestra tu código en una tienda aliada para ganar tus primeros puntos.</p>
      ) : (
        <ul className="lista-movs">
          {historial.datos.map((m) => {
            const gana = m.tipo === 'entrega'
            return (
              <li key={m.id} className={gana ? 'mov-gana' : 'mov-usa'}>
                <div>
                  <p className="mov-tienda">{m.comercio}</p>
                  <p className="mov-detalle">
                    {gana ? `Compra de ${pesos(m.valorCompra)}` : `Descuento de ${pesos(m.puntos * DESCUENTO_POR_PUNTO)}`} ·{' '}
                    {fechaCorta(m.fecha)} ·{' '}
                    <a href={enlaceTx(m.txHash)} target="_blank" rel="noreferrer">ver en la red</a>
                  </p>
                </div>
                <p className="mov-puntos">{gana ? `+${m.puntos}` : `−${m.puntos}`}</p>
              </li>
            )
          })}
        </ul>
      )}

      <div className="caja-aprende">
        <p>
          <strong>Qué pasa en Stellar:</strong> tu saldo se lee directo del contrato en la red, no de una base
          de datos de las tiendas. Cada movimiento enlaza a su transacción: cualquiera puede comprobarlo.
        </p>
      </div>

      <button
        type="button"
        className="enlace-discreto"
        onClick={() => {
          salirCliente()
          navigate('/cliente/registro')
        }}
      >
        Cerrar sesión
      </button>
    </Layout>
  )
}

export default function Saldo() {
  return (
    <RequiereCliente>
      <Contenido />
    </RequiereCliente>
  )
}
