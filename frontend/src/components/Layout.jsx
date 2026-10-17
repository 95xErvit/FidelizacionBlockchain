// Marco común: barra superior con el rol, la wallet conectada y las pestañas de cada rol.
import { Link, NavLink } from 'react-router-dom'
import { cortar, enlaceContrato, enlaceCuenta, stellarConfig } from '../config/stellar.js'
import { useStore } from '../data/store.jsx'

const MENUS = {
  cliente: [
    { to: '/cliente/saldo', label: 'Mis puntos' },
    { to: '/cliente/codigo', label: 'Mi código' },
    { to: '/cliente/tiendas', label: 'Tiendas' },
  ],
  tendero: [
    { to: '/tendero/entregar', label: 'Entregar' },
    { to: '/tendero/redimir', label: 'Redimir' },
    { to: '/tendero/reporte', label: 'Reporte' },
  ],
  admin: [
    { to: '/admin/solicitudes', label: 'Comercios' },
    { to: '/admin/red', label: 'La red' },
  ],
}

const NOMBRE_ROL = { cliente: 'Cliente', tendero: 'Tienda', admin: 'Administración' }

export default function Layout({ rol, subtitulo, ancho = 'angosto', sinMenu = false, children }) {
  const { wallet, desconectar } = useStore()
  const menu = MENUS[rol] || []
  const usaWallet = rol === 'tendero' || rol === 'admin'
  return (
    <div className={`marco marco-${rol}`}>
      <header className="barra">
        <Link to="/" className="marca" aria-label="Volver al inicio">
          <span className="marca-sello" aria-hidden="true">P</span>
          <span className="marca-texto">Puntos del Barrio</span>
        </Link>
        {rol && (
          <span className="barra-rol">
            {NOMBRE_ROL[rol]}
            {subtitulo ? <strong> {subtitulo}</strong> : null}
          </span>
        )}
        {usaWallet && wallet && (
          <span className="barra-wallet">
            <a href={enlaceCuenta(wallet)} target="_blank" rel="noreferrer" className="codigo" title={wallet}>
              {cortar(wallet)}
            </a>
            <button type="button" className="enlace-discreto" onClick={desconectar}>
              Salir
            </button>
          </span>
        )}
      </header>
      {!sinMenu && menu.length > 0 && (
        <nav className="pestanas" aria-label={`Menú de ${NOMBRE_ROL[rol]}`}>
          {menu.map((m) => (
            <NavLink key={m.to} to={m.to} className={({ isActive }) => (isActive ? 'activa' : '')}>
              {m.label}
            </NavLink>
          ))}
        </nav>
      )}
      <main className={`contenido contenido-${ancho}`}>{children}</main>
      <footer className="pie">
        Red de pruebas de Stellar ({stellarConfig.red}) ·{' '}
        {stellarConfig.contractId ? (
          <a href={enlaceContrato()} target="_blank" rel="noreferrer">
            contrato {cortar(stellarConfig.contractId)}
          </a>
        ) : (
          'falta configurar VITE_CONTRACT_ID'
        )}
      </footer>
    </div>
  )
}
