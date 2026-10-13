// Paso 10: el administrador revisa los totales de la red y el límite de cada comercio.
import Layout from '../../components/Layout.jsx'
import { useStore } from '../../data/store.jsx'

export default function Red() {
  const { comercios, clientes, movimientos, emitidosEsteMes, cambiarLimite, saldoDe } = useStore()
  const aprobados = comercios.filter((c) => c.estado === 'aprobado')
  const emitidos = movimientos.filter((m) => m.tipo === 'entrega').reduce((s, m) => s + m.puntos, 0)
  const redimidos = movimientos.filter((m) => m.tipo === 'redencion').reduce((s, m) => s + m.puntos, 0)
  const enCirculacion = clientes.reduce((s, c) => s + saldoDe(c.id), 0)

  return (
    <Layout rol="admin" ancho="ancho">
      <h1 className="titulo">La red</h1>

      <dl className="cifras cifras-4">
        <div>
          <dt>Comercios activos</dt>
          <dd>{aprobados.length}</dd>
        </div>
        <div>
          <dt>Clientes</dt>
          <dd>{clientes.length}</dd>
        </div>
        <div>
          <dt>Puntos emitidos</dt>
          <dd>{emitidos}</dd>
        </div>
        <div>
          <dt>En manos de clientes</dt>
          <dd>{enCirculacion}</dd>
          <p className="cifra-nota">{redimidos} ya redimidos</p>
        </div>
      </dl>

      <h2 className="titulo-seccion">Límite mensual por comercio</h2>
      <div className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Comercio</th>
              <th scope="col">Entregados este mes</th>
              <th scope="col">Recibidos</th>
              <th scope="col">Límite</th>
            </tr>
          </thead>
          <tbody>
            {aprobados.map((c) => {
              const recibidos = movimientos
                .filter((m) => m.comercioId === c.id && m.tipo === 'redencion')
                .reduce((s, m) => s + m.puntos, 0)
              return (
                <tr key={c.id}>
                  <th scope="row">{c.nombre}</th>
                  <td>{emitidosEsteMes(c.id)}</td>
                  <td>{recibidos}</td>
                  <td>
                    <label className="oculto" htmlFor={`lim-${c.id}`}>
                      Límite de {c.nombre}
                    </label>
                    <input
                      id={`lim-${c.id}`}
                      className="input-tabla"
                      inputMode="numeric"
                      value={c.limiteMensual}
                      onChange={(e) => cambiarLimite(c.id, Number(e.target.value.replace(/\D/g, '')) || 0)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="caja-aprende">
        <p>
          <strong>Decisión técnica:</strong> el límite lo hace cumplir el servicio de la red antes de
          enviar el pago, no un contrato propio. Usamos lo que Stellar ya trae (activo, trustlines
          autorizadas y pagos con memo).
        </p>
      </div>
    </Layout>
  )
}
