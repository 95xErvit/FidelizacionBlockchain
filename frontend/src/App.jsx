// Mapa de pantallas. Cada ruta corresponde a un paso del flujo del Blueprint.
import { Navigate, Route, Routes } from 'react-router-dom'
import Inicio from './pages/Inicio.jsx'
// Cliente (pasos 3, 4, 6)
import Registro from './pages/cliente/Registro.jsx'
import MiCodigo from './pages/cliente/MiCodigo.jsx'
import Saldo from './pages/cliente/Saldo.jsx'
import Tiendas from './pages/cliente/Tiendas.jsx'
// Tendero (pasos 2, 5, 8, 9)
import ElegirTienda from './pages/tendero/ElegirTienda.jsx'
import Entregar from './pages/tendero/Entregar.jsx'
import Redimir from './pages/tendero/Redimir.jsx'
import Reporte from './pages/tendero/Reporte.jsx'
// Administrador (pasos 1, 10)
import Solicitudes from './pages/admin/Solicitudes.jsx'
import Red from './pages/admin/Red.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />

      <Route path="/cliente" element={<Navigate to="/cliente/registro" replace />} />
      <Route path="/cliente/registro" element={<Registro />} />
      <Route path="/cliente/codigo" element={<MiCodigo />} />
      <Route path="/cliente/saldo" element={<Saldo />} />
      <Route path="/cliente/tiendas" element={<Tiendas />} />

      <Route path="/tendero" element={<ElegirTienda />} />
      <Route path="/tendero/entregar" element={<Entregar />} />
      <Route path="/tendero/redimir" element={<Redimir />} />
      <Route path="/tendero/reporte" element={<Reporte />} />

      <Route path="/admin" element={<Navigate to="/admin/solicitudes" replace />} />
      <Route path="/admin/solicitudes" element={<Solicitudes />} />
      <Route path="/admin/red" element={<Red />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
