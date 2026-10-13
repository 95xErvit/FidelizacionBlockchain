// Paso 1: el administrador revisa las solicitudes de comercios y las aprueba.
import { useState } from 'react'
import Layout from '../../components/Layout.jsx'
import { useStore } from '../../data/store.jsx'

export default function Solicitudes() {
  const { comercios, aprobarComercio, rechazarComercio, solicitarComercio } = useStore()
  const [form, setForm] = useState({ nombre: '', barrio: '', responsable: '' })
  const pendientes = comercios.filter((c) => c.estado === 'pendiente')
  const resto = comercios.filter((c) => c.estado !== 'pendiente')

  function agregar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    solicitarComercio({ nombre: form.nombre.trim(), barrio: form.barrio.trim() || 'Sin barrio', responsable: form.responsable.trim() || '—' })
    setForm({ nombre: '', barrio: '', responsable: '' })
  }

  return (
    <Layout rol="admin" ancho="ancho">
      <h1 className="titulo">Comercios</h1>
      <p className="bajada">Aprobar un comercio le permite entregar y recibir puntos de la red.</p>

      <h2 className="titulo-seccion">Por revisar ({pendientes.length})</h2>
      {pendientes.length === 0 ? (
        <p className="vacio">No hay solicitudes pendientes.</p>
      ) : (
        <ul className="lista-tiendas">
          {pendientes.map((t) => (
            <li key={t.id}>
              <span className="tienda-inicial" aria-hidden="true">{t.nombre[0]}</span>
              <div className="crece">
                <p className="mov-tienda">{t.nombre}</p>
                <p className="mov-detalle">
                  {t.barrio} · {t.responsable}
                </p>
              </div>
              <div className="acciones">
                <button type="button" className="boton boton-secundario" onClick={() => rechazarComercio(t.id)}>
                  Rechazar
                </button>
                <button type="button" className="boton" onClick={() => aprobarComercio(t.id)}>
                  Aprobar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="caja-aprende">
        <p>
          <strong>Qué pasa en Stellar:</strong> al aprobar, se crea la cuenta del comercio y el emisor
          autoriza su línea de confianza (trustline) con el activo PUNTOS. Sin esa autorización, la red
          no le deja tener puntos.
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
                {t.barrio} · {t.cuenta ? <span className="codigo">{t.cuenta}</span> : 'sin cuenta'}
              </p>
            </div>
            <span className={`estado estado-${t.estado}`}>{t.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}</span>
          </li>
        ))}
      </ul>

      <h2 className="titulo-seccion">Registrar una solicitud</h2>
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
        <button className="boton" type="submit">Agregar solicitud</button>
      </form>
    </Layout>
  )
}
