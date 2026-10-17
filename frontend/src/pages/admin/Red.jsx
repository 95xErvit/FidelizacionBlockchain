// Paso 10: el administrador revisa los totales de la red y cambia el límite de
// cada comercio FIRMANDO en el contrato (el límite lo hace cumplir el contrato).
import { useState } from 'react'
import Layout from '../../components/Layout.jsx'
import EstadoTx from '../../components/EstadoTx.jsx'
import { RequiereAdmin } from '../../components/RequiereSesion.jsx'
import { useStore } from '../../data/store.jsx'
import { useCarga } from '../../hooks/useCarga.js'
import { ocupado, useTx } from '../../hooks/useTx.js'
import { api } from '../../lib/api.js'
import { desactivarComercio, leerEmitidosPeriodo, registrarComercio } from '../../lib/contrato.js'

function Fila({ comercio, totales }) {
  const { wallet, recargarComercios } = useStore()
  const emitidos = useCarga(() => leerEmitidosPeriodo(comercio.cuenta), [comercio.cuenta])
  const { tx, ejecutar, reintentar, reiniciar } = useTx()
  const [limite, setLimite] = useState(String(comercio.limiteMensual))
  const cambio = Number(limite) !== comercio.limiteMensual

  async function firmar(accion) {
    const r = await ejecutar(async ({ firmar: f, alPaso }) => {
      const op = { firmar: f, alPaso }
      const res = accion === 'limite'
        ? await registrarComercio(wallet, comercio.cuenta, Number(limite) || 0, op)
        : await desactivarComercio(wallet, comercio.cuenta, op)
      alPaso('guardando')
      await api.sincronizarComercio(comercio.id, res.hash)
      return res
    })
    if (r) recargarComercios()
  }

  return (
    <>
      <tr>
        <th scope="row">{comercio.nombre}</th>
        <td>{emitidos.cargando ? '…' : emitidos.error ? '—' : emitidos.datos}</td>
        <td>{totales?.recibidos ?? 0}</td>
        <td>
          <label className="oculto" htmlFor={`lim-${comercio.id}`}>Límite de {comercio.nombre}</label>
          <input
            id={`lim-${comercio.id}`}
            className="input-tabla"
            inputMode="numeric"
            value={limite}
            disabled={ocupado(tx)}
            onChange={(e) => {
              setLimite(e.target.value.replace(/\D/g, ''))
              if (tx.estado === 'error') reiniciar()
            }}
          />
        </td>
        <td className="acciones">
          <button type="button" className="boton" disabled={!cambio || ocupado(tx)} onClick={() => firmar('limite')}>
            Guardar en la red
          </button>
          <button type="button" className="boton boton-secundario" disabled={ocupado(tx)} onClick={() => firmar('desactivar')}>
            Desactivar
          </button>
        </td>
      </tr>
      {tx.estado !== 'inactivo' && tx.estado !== 'confirmado' && (
        <tr>
          <td colSpan={5}>
            <EstadoTx tx={tx} onReintentar={reintentar} cuenta={wallet} />
          </td>
        </tr>
      )}
    </>
  )
}

function Contenido() {
  const { comercios } = useStore()
  const resumen = useCarga(() => api.resumen(), [comercios])
  const aprobados = comercios.filter((c) => c.estado === 'aprobado' && c.cuenta)
  const r = resumen.datos

  return (
    <Layout rol="admin" ancho="ancho">
      <h1 className="titulo">La red</h1>
      {resumen.error && <p className="error">{resumen.error}</p>}

      <dl className="cifras cifras-4">
        <div>
          <dt>Comercios activos</dt>
          <dd>{aprobados.length}</dd>
        </div>
        <div>
          <dt>Clientes</dt>
          <dd>{r ? r.clientes : '…'}</dd>
        </div>
        <div>
          <dt>Puntos emitidos</dt>
          <dd>{r ? r.emitidos : '…'}</dd>
        </div>
        <div>
          <dt>En manos de clientes</dt>
          <dd>{r ? r.enCirculacion : '…'}</dd>
          <p className="cifra-nota">{r ? r.redimidos : '…'} ya redimidos</p>
        </div>
      </dl>

      <h2 className="titulo-seccion">Límite por comercio (cada 30 días)</h2>
      <div className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Comercio</th>
              <th scope="col">Entregados en el periodo</th>
              <th scope="col">Recibidos</th>
              <th scope="col">Límite</th>
              <th scope="col"><span className="oculto">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {aprobados.map((c) => (
              <Fila key={c.id} comercio={c} totales={r?.porComercio?.[c.id]} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="caja-aprende">
        <p>
          <strong>Decisión técnica:</strong> el límite lo hace cumplir el <strong>contrato</strong>, no el servidor.
          Si una tienda intenta entregar más puntos de los permitidos, la red rechaza la transacción
          (<span className="codigo">LimiteMensualSuperado</span>), aunque alguien modifique la app.
        </p>
      </div>
    </Layout>
  )
}

export default function Red() {
  return (
    <RequiereAdmin>
      <Contenido />
    </RequiereAdmin>
  )
}
