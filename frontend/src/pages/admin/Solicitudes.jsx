// Paso 1: el administrador revisa las solicitudes de comercios y las aprueba
// FIRMANDO registrar_comercio en el contrato. Después la API refleja el cambio.
import { useState } from 'react'
import Layout from '../../components/Layout.jsx'
import EstadoTx from '../../components/EstadoTx.jsx'
import { RequiereAdmin } from '../../components/RequiereSesion.jsx'
import { cortar } from '../../config/stellar.js'
import { useStore } from '../../data/store.jsx'
import { ocupado, useTx } from '../../hooks/useTx.js'
import { api } from '../../lib/api.js'
import { registrarComercio } from '../../lib/contrato.js'

const RE_CUENTA = /^G[A-Z2-7]{55}$/
const ETIQUETA = { aprobado: 'Aprobado', rechazado: 'Rechazado', inactivo: 'Desactivado', pendiente: 'En revisión' }

function Pendiente({ comercio }) {
  const { wallet, recargarComercios } = useStore()
  const { tx, ejecutar, reintentar, reiniciar } = useTx()
  const [cuenta, setCuenta] = useState(comercio.cuenta || '')
  const [limite, setLimite] = useState(String(comercio.limiteMensual || 2000))
  const [error, setError] = useState('')
  const cuentaValida = RE_CUENTA.test(cuenta.trim())

  async function aprobar() {
    const r = await ejecutar(async ({ firmar, alPaso }) => {
      const res = await registrarComercio(wallet, cuenta.trim(), Number(limite) || 0, { firmar, alPaso })
      alPaso('guardando')
      await api.sincronizarComercio(comercio.id, res.hash)
      return res
    })
    if (r) recargarComercios()
  }

  async function rechazar() {
    setError('')
    try {
      await api.rechazarComercio(comercio.id)
      recargarComercios()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <li className="pendiente">
      <span className="tienda-inicial" aria-hidden="true">{comercio.nombre[0]}</span>
      <div className="crece">
        <p className="mov-tienda">{comercio.nombre}</p>
        <p className="mov-detalle">
          {comercio.barrio || 'Sin barrio'} · {comercio.responsable || '—'}
        </p>
        <div className="formulario formulario-fila formulario-compacto">
          <div>
            <label htmlFor={`c-${comercio.id}`}>Cuenta Stellar de la tienda</label>
            <input
              id={`c-${comercio.id}`}
              className="codigo"
              placeholder="G…"
              value={cuenta}
              disabled={Boolean(comercio.cuenta) || ocupado(tx)}
              onChange={(e) => {
                setCuenta(e.target.value.toUpperCase())
                if (tx.estado === 'error') reiniciar()
              }}
            />
          </div>
          <div>
            <label htmlFor={`l-${comercio.id}`}>Límite (puntos / 30 días)</label>
            <input
              id={`l-${comercio.id}`}
              inputMode="numeric"
              value={limite}
              disabled={ocupado(tx)}
              onChange={(e) => {
                setLimite(e.target.value.replace(/\D/g, ''))
                if (tx.estado === 'error') reiniciar()
              }}
            />
          </div>
        </div>
        <EstadoTx tx={tx} onReintentar={reintentar} cuenta={wallet} />
        {error && <p className="error">{error}</p>}
      </div>
      <div className="acciones">
        <button type="button" className="boton boton-secundario" disabled={ocupado(tx)} onClick={rechazar}>
          Rechazar
        </button>
        <button type="button" className="boton" disabled={!cuentaValida || ocupado(tx)} onClick={aprobar}>
          {ocupado(tx) ? 'Firmando…' : 'Aprobar y firmar'}
        </button>
      </div>
    </li>
  )
}

function NuevaSolicitud() {
  const { recargarComercios } = useStore()
  const [form, setForm] = useState({ nombre: '', barrio: '', responsable: '', cuenta: '' })
  const [error, setError] = useState('')

  async function agregar(e) {
    e.preventDefault()
    setError('')
    try {
      await api.solicitarComercio({ ...form, cuenta: form.cuenta.trim() || undefined })
      setForm({ nombre: '', barrio: '', responsable: '', cuenta: '' })
      recargarComercios()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="formulario formulario-fila" onSubmit={agregar}>
      <div>
        <label htmlFor="n">Nombre del comercio</label>
        <input id="n" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      </div>
      <div>
        <label htmlFor="b">Barrio</label>
        <input id="b" value={form.barrio} onChange={(e) => setForm({ ...form, barrio: e.target.value })} />
      </div>
      <div>
        <label htmlFor="r">Responsable</label>
        <input id="r" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
      </div>
      <div>
        <label htmlFor="g">Cuenta Stellar (opcional)</label>
        <input id="g" placeholder="G…" value={form.cuenta} onChange={(e) => setForm({ ...form, cuenta: e.target.value.toUpperCase() })} />
      </div>
      <button className="boton" type="submit" disabled={form.nombre.trim().length < 2}>
        Agregar solicitud
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}

function Contenido() {
  const { comercios, cargandoComercios } = useStore()
  const pendientes = comercios.filter((c) => c.estado === 'pendiente')
  const resto = comercios.filter((c) => c.estado !== 'pendiente')

  return (
    <Layout rol="admin" ancho="ancho">
      <h1 className="titulo">Comercios</h1>
      <p className="bajada">Aprobar un comercio lo registra en el contrato: desde ese momento puede entregar y recibir puntos.</p>

      <h2 className="titulo-seccion">Por revisar ({pendientes.length})</h2>
      {cargandoComercios ? (
        <p className="vacio">Cargando…</p>
      ) : pendientes.length === 0 ? (
        <p className="vacio">No hay solicitudes pendientes.</p>
      ) : (
        <ul className="lista-tiendas">
          {pendientes.map((t) => (
            <Pendiente key={t.id} comercio={t} />
          ))}
        </ul>
      )}

      <div className="caja-aprende">
        <p>
          <strong>Qué pasa en Stellar:</strong> al aprobar, tu wallet firma <span className="codigo">registrar_comercio</span>{' '}
          con la cuenta de la tienda y su límite. El contrato solo acepta esa operación si la firma el administrador.
        </p>
      </div>

      <h2 className="titulo-seccion">Revisados</h2>
      <ul className="lista-tiendas">
        {resto.map((t) => (
          <li key={t.id}>
            <span className="tienda-inicial" aria-hidden="true">{t.nombre[0]}</span>
            <div className="crece">
              <p className="mov-tienda">{t.nombre}</p>
              <p className="mov-detalle">
                {t.barrio || 'Sin barrio'} · {t.cuenta ? <span className="codigo">{cortar(t.cuenta, 6)}</span> : 'sin cuenta'}
              </p>
            </div>
            <span className={`estado estado-${t.estado}`}>{ETIQUETA[t.estado]}</span>
          </li>
        ))}
      </ul>

      <h2 className="titulo-seccion">Registrar una solicitud</h2>
      <NuevaSolicitud />
    </Layout>
  )
}

export default function Solicitudes() {
  return (
    <RequiereAdmin>
      <Contenido />
    </RequiereAdmin>
  )
}

