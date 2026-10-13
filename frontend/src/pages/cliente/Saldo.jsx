// Paso 6: el cliente consulta su saldo y su historial.
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Tiquete from '../../components/Tiquete.jsx'
import { RequiereCliente } from '../../components/RequiereSesion.jsx'
import { fechaCorta, pesos, useStore } from '../../data/store.jsx'

function Contenido() {
  const { clienteActivoId, clientePorId, comercioPorId, saldoDe, movimientos, reglas, salirCliente } = useStore()
  const navigate = useNavigate()
  const cliente = clientePorId(clienteActivoId)
  const saldo = saldoDe(cliente.id)
  const mios = movimientos
    .filter((m) => m.clienteId === cliente.id)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  return (
    <Layout rol="cliente" subtitulo={cliente.nombre}>
      <Tiquete puntos={saldo} nombre={`Hola, ${cliente.nombre.split(' ')[0]}`} descuento={pesos(saldo * reglas.descuentoPorPunto)} />

      <h2 className="titulo-seccion">Tu historial</h2>
      {mios.length === 0 ? (
        <p className="vacio">Todavía no tienes movimientos. Muestra tu código en una tienda aliada para ganar tus primeros puntos.</p>
      ) : (
        <ul className="lista-movs">
          {mios.map((m) => {
            const tienda = comercioPorId(m.comercioId)
            const gana = m.tipo === 'entrega'
            return (
              <li key={m.id} className={gana ? 'mov-gana' : 'mov-usa'}>
                <div>
                  <p className="mov-tienda">{tienda?.nombre}</p>
                  <p className="mov-detalle">
                    {gana ? `Compra de ${pesos(m.valorCompra)}` : `Descuento de ${pesos(m.puntos * reglas.descuentoPorPunto)}`} · {fechaCorta(m.fecha)}
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
          <strong>Qué pasa en Stellar:</strong> este saldo e historial se leerán directo de la red
          (Horizon), no de una base de datos de la red de tiendas. Cualquiera puede comprobarlos.
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
