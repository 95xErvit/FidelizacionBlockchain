// Paso 9: la tienda consulta cuántos puntos entregó, cuántos recibió y qué clientes volvieron.
import Layout from '../../components/Layout.jsx'
import { RequiereComercio } from '../../components/RequiereSesion.jsx'
import { fechaCorta, pesos, useStore } from '../../data/store.jsx'

function Contenido() {
  const { comercioActivoId, comercioPorId, clientePorId, movimientos, reglas, emitidosEsteMes } = useStore()
  const comercio = comercioPorId(comercioActivoId)
  const propios = movimientos
    .filter((m) => m.comercioId === comercio.id)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  const entregados = propios.filter((m) => m.tipo === 'entrega').reduce((s, m) => s + m.puntos, 0)
  const recibidos = propios.filter((m) => m.tipo === 'redencion').reduce((s, m) => s + m.puntos, 0)
  const conteo = {}
  propios.forEach((m) => (conteo[m.clienteId] = (conteo[m.clienteId] || 0) + 1))
  const volvieron = Object.values(conteo).filter((n) => n > 1).length
  const usoLimite = Math.min(100, Math.round((emitidosEsteMes(comercio.id) / comercio.limiteMensual) * 100))

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
          <p className="cifra-nota">{pesos(recibidos * reglas.descuentoPorPunto)} en descuentos</p>
        </div>
        <div>
          <dt>Clientes que volvieron</dt>
          <dd>{volvieron}</dd>
          <p className="cifra-nota">de {Object.keys(conteo).length} atendidos</p>
        </div>
      </dl>

      <div className="medidor" aria-label={`Has usado el ${usoLimite}% de tu límite mensual`}>
        <p>
          Límite del mes: {emitidosEsteMes(comercio.id)} de {comercio.limiteMensual.toLocaleString('es-CO')} puntos
        </p>
        <div className="medidor-barra">
          <span style={{ width: `${usoLimite}%` }} />
        </div>
      </div>

      <h2 className="titulo-seccion">Movimientos</h2>
      {propios.length === 0 ? (
        <p className="vacio">Aún no hay movimientos. Entrega puntos a tu primer cliente desde la pestaña Entregar.</p>
      ) : (
        <ul className="lista-movs">
          {propios.map((m) => {
            const gana = m.tipo === 'entrega'
            return (
              <li key={m.id} className={gana ? 'mov-gana' : 'mov-usa'}>
                <div>
                  <p className="mov-tienda">{clientePorId(m.clienteId)?.nombre}</p>
                  <p className="mov-detalle">
                    {gana ? 'Entregados' : 'Recibidos'} · {fechaCorta(m.fecha)} · <span className="codigo">{m.memo}</span>
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
