// Paso 2: el tendero entra a la app con su tienda (solo las aprobadas pueden operar).
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { useStore } from '../../data/store.jsx'

export default function ElegirTienda() {
  const { comercios, elegirComercio } = useStore()
  const navigate = useNavigate()

  function entrar(id) {
    elegirComercio(id)
    navigate('/tendero/entregar')
  }

  return (
    <Layout rol="tendero" sinMenu>
      <h1 className="titulo">¿Desde qué tienda vas a atender?</h1>
      <p className="bajada">Solo las tiendas aprobadas por el administrador pueden entregar y recibir puntos.</p>
      <ul className="lista-tiendas">
        {comercios.map((t) => {
          const aprobada = t.estado === 'aprobado'
          return (
            <li key={t.id}>
              <span className="tienda-inicial" aria-hidden="true">{t.nombre[0]}</span>
              <div className="crece">
                <p className="mov-tienda">{t.nombre}</p>
                <p className="mov-detalle">
                  {t.barrio} · {t.responsable}
                </p>
              </div>
              {aprobada ? (
                <button type="button" className="boton" onClick={() => entrar(t.id)}>
                  Entrar
                </button>
              ) : (
                <span className={`estado estado-${t.estado}`}>{t.estado === 'pendiente' ? 'En revisión' : 'Rechazada'}</span>
              )}
            </li>
          )
        })}
      </ul>
    </Layout>
  )
}
