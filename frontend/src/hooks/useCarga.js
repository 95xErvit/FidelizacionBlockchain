// Carga datos asíncronos (API o contrato) con estados de carga y error.
import { useCallback, useEffect, useState } from 'react'

export function useCarga(cargar, deps = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: '' })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(async () => {
    setEstado((e) => ({ ...e, cargando: true, error: '' }))
    try {
      const datos = await cargar()
      setEstado({ datos, cargando: false, error: '' })
    } catch (e) {
      setEstado((s) => ({ ...s, cargando: false, error: e?.message || 'No se pudo cargar.' }))
    }
  }, deps)

  useEffect(() => {
    recargar()
  }, [recargar])

  return { ...estado, recargar }
}
