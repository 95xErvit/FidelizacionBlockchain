// Paso 6: el cliente ve en qué tiendas puede usar sus puntos.
import Layout from '../../components/Layout.jsx'
import { RequiereCliente } from '../../components/RequiereSesion.jsx'
import { useStore } from '../../data/store.jsx'

function Contenido() {
  const { comercios, clienteActivoId, clientePorId, movimientos } = useStore()
  const cliente = clientePorId(clienteActivoId)
  const aliadas = comercios.filter((c) => c.estado === 'aprobado')

  return (
    <Layout rol="cliente" subtitulo={cliente.nombre}>
      <h1 className="titulo">Tiendas aliadas</h1>
      <p className="bajada">Gana puntos en cualquiera de estas tiendas y úsalos en la que prefieras.</p>
      <ul className="lista-tiendas">
        {aliadas.map((t) => {
          const visitas = movimientos.filter((m) => m.clienteId === cliente.id && m.comercioId === t.id).length
          return (
            <li key={t.id}>
              <span className="tienda-inicial" aria-hidden="true">{t.nombre[0]}</span>
              <div>
                <p className="mov-tienda">{t.nombre}</p>
                <p className="mov-detalle">
                  {t.barrio} · {visitas > 0 ? `${visitas} movimiento${visitas > 1 ? 's' : ''} tuyo${visitas > 1 ? 's' : ''}` : 'aún no la visitas'}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </Layout>
  )
}

export default function Tiendas() {
  return (
    <RequiereCliente>
      <Contenido />
    </RequiereCliente>
  )
}
