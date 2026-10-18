// Paso 9: la tienda consulta cuántos puntos entregó, cuántos recibió y qué clientes volvieron.
import Layout from '../../components/Layout.jsx'
import { RequiereComercio } from '../../components/RequiereSesion.jsx'
import { DESCUENTO_POR_PUNTO, cortar, enlaceTx } from '../../config/stellar.js'
import { fechaCorta, pesos, useStore } from '../../data/store.jsx'
import { useCarga } from '../../hooks/useCarga.js'
import { api } from '../../lib/api.js'
import { leerEmitidosPeriodo } from '../../lib/contrato.js'

function Contenido() {
  const { wallet, comercioDeWallet: comercio } = useStore()
  const historial = useCarga(() => api.movimientosComercio(comercio.id).then((r) => r.movimientos), [comercio.id])
  const emitidos = useCarga(() => leerEmitidosPeriodo(wallet), [wallet])
  const propios = historial.datos || []

  const entregados = propios.filter((m) => m.tipo === 'entrega').reduce((s, m) => s + m.puntos, 0)
  const recibidos = propios.filter((m) => m.tipo === 'redencion').reduce((s, m) => s + m.puntos, 0)
  const conteo = {}
  propios.forEach((m) => (conteo[m.clienteId] = (conteo[m.clienteId] || 0) + 1))
  const volvieron = Object.values(conteo).filter((n) => n > 1).length
  const usados = emitidos.datos ?? 0
  const usoLimite = comercio.limiteMensual ? Math.min(100, Math.round((usados / comercio.limiteMensual) * 100)) : 0

  return (
    <Layout rol="tendero" subtitulo={comercio.nombre}>
      <h1 className="titulo">Reporte de la tienda</h1>

      <dl className="cifras">
        <div>
          <dt>Puntos entregados</dt>
          <dd>{entregados}</dd>
        </div>
        <div>
          <dt>Puntos recibidos</dt>
          <dd>{recibidos}</dd>
          <p className="cifra-nota">{pesos(recibidos * DESCUENTO_POR_PUNTO)} en descuentos</p>
        </div>
        <div>
          <dt>Clientes que volvieron</dt>
          <dd>{volvieron}</dd>
          <p className="cifra-nota">de {Object.keys(conteo).length} atendidos</p>
        </div>
      </dl>

      <div className="medidor" aria-label={`Has usado el ${usoLimite}% de tu límite`}>
        <p>
          Límite del periodo (según el contrato): {emitidos.cargando ? '…' : usados} de{' '}
          {comercio.limiteMensual.toLocaleString('es-CO')} puntos
        </p>
        <div className="medidor-barra">
          <span style={{ width: `${usoLimite}%` }} />
        </div>
      </div>

      <h2 className="titulo-seccion">Movimientos</h2>
      {historial.cargando ? (
        <p className="vacio">Cargando…</p>
      ) : historial.error ? (
        <p className="error">{historial.error}</p>
      ) : propios.length === 0 ? (
        <p className="vacio">Aún no hay movimientos. Entrega puntos a tu primer cliente desde la pestaña Entregar.</p>
      ) : (
        <ul className="lista-movs">
          {propios.map((m) => {
            const gana = m.tipo === 'entrega'
            return (
              <li key={m.id} className={gana ? 'mov-gana' : 'mov-usa'}>
                <div>
                  <p className="mov-tienda">Cliente {cortar(m.clienteId, 4)}</p>
                  <p className="mov-detalle">
                    {gana ? 'Entregados' : 'Recibidos'} · {fechaCorta(m.fecha)} ·{' '}
                    <a href={enlaceTx(m.txHash)} target="_blank" rel="noreferrer" className="codigo">{cortar(m.txHash, 6)}</a>
                  </p>
                </div>
                <p className="mov-puntos">{m.puntos}</p>
              </li>
            )
          })}
        </ul>
      )}
    </Layout>
  )
}

export default function Reporte() {
  return (
    <RequiereComercio>
      <Contenido />
    </RequiereComercio>
  )
}
