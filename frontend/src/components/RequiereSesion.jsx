// Si nadie ha iniciado sesión en ese rol, manda a la pantalla de entrada.
import { Navigate } from 'react-router-dom'
import { useStore } from '../data/store.jsx'

export function RequiereCliente({ children }) {
  const { clienteActivoId } = useStore()
  if (!clienteActivoId) return <Navigate to="/cliente/registro" replace />
  return children
}

export function RequiereComercio({ children }) {
  const { comercioActivoId } = useStore()
  if (!comercioActivoId) return <Navigate to="/tendero" replace />
  return children
}
