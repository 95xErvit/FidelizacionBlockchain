// ─────────────────────────────────────────────────────────────────────────────
// ESTADOS · Máquina de estados de una transacción
//
//   inactivo → simulando → esperando-firma → enviando → confirmando → guardando → confirmado
//                  ╲              ╲              ╲            ╲            ╲
//                   ╰──────────────┴──────────────┴────────────┴────────────┴──→ error
//
// En cada momento hay UN solo estado y la pantalla muestra exactamente ese.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useRef, useState } from 'react'
import { traducirError } from '../lib/errores.js'
import { firmarConWallet } from '../lib/wallet.js'

export const PASOS = [
  ['simulando', 'Revisando con el contrato'],
  ['esperando-firma', 'Firma en tu wallet'],
  ['enviando', 'Enviando a la red'],
  ['confirmando', 'Esperando confirmación (~5 s)'],
  ['guardando', 'Guardando en el historial'],
]

export const ocupado = (s) => !['inactivo', 'confirmado', 'error'].includes(s.estado)

/**
 * tarea: async ({ firmar, alPaso }) => resultado
 * La tarea llama alPaso('simulando' | …) a medida que avanza.
 */
export function useTx() {
  const [estado, setEstado] = useState({ estado: 'inactivo' })
  const ultima = useRef(null)

  const ejecutar = useCallback(async (tarea) => {
    ultima.current = tarea
    let paso = 'simulando'
    setEstado({ estado: paso })
    try {
      const resultado = await tarea({
        firmar: firmarConWallet,
        alPaso: (p) => {
          paso = p
          setEstado({ estado: p })
        },
      })
      setEstado({ estado: 'confirmado', resultado })
      return resultado
    } catch (error) {
      console.error(error)
      setEstado({ estado: 'error', error: traducirError(error), paso })
      return null
    }
  }, [])

  const reintentar = useCallback(() => ultima.current && ejecutar(ultima.current), [ejecutar])
  const reiniciar = useCallback(() => setEstado({ estado: 'inactivo' }), [])

  return { tx: estado, ejecutar, reintentar, reiniciar }
}
