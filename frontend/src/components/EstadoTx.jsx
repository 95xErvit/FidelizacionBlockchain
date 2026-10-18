// Muestra en qué paso va una transacción y, si falla, qué pasó y qué hacer.
import { useState } from 'react'
import { enlaceTx } from '../config/stellar.js'
import { PASOS } from '../hooks/useTx.js'
import { fondearConFriendbot } from '../lib/wallet.js'

export default function EstadoTx({ tx, onReintentar, cuenta }) {
  const [fondeando, setFondeando] = useState(false)

  if (tx.estado === 'inactivo' || tx.estado === 'confirmado') return null

  if (tx.estado === 'error') {
    const { titulo, mensaje, accion, hash, detalle } = tx.error
    return (
      <div className="tx-error" role="alert">
        <p className="tx-error-titulo">{titulo}</p>
        <p>{mensaje}</p>
        {hash && (
          <p>
            <a href={enlaceTx(hash)} target="_blank" rel="noreferrer">Ver la transacción en el explorador</a>
          </p>
        )}
        <div className="acciones">
          {accion === 'friendbot' && cuenta && (
            <button
              type="button"
              className="boton boton-secundario"
              disabled={fondeando}
              onClick={async () => {
                setFondeando(true)
                try {
                  await fondearConFriendbot(cuenta)
                } finally {
                  setFondeando(false)
                }
                onReintentar?.()
              }}
            >
              {fondeando ? 'Pidiendo XLM…' : 'Dar XLM de prueba y reintentar'}
            </button>
          )}
          {accion === 'reintentar' && onReintentar && (
            <button type="button" className="boton boton-secundario" onClick={onReintentar}>
              Reintentar
            </button>
          )}
        </div>
        <details className="tx-detalle">
          <summary>Detalle técnico</summary>
          <code>{detalle}</code>
        </details>
      </div>
    )
  }

  const actual = PASOS.findIndex(([id]) => id === tx.estado)
  return (
    <ol className="tx-pasos" aria-live="polite">
      {PASOS.map(([id, texto], i) => (
        <li key={id} className={i < actual ? 'hecho' : i === actual ? 'actual' : ''}>
          {texto}
          {id === 'esperando-firma' && i === actual && <span className="tx-pista"> · revisa la ventana de tu wallet</span>}
        </li>
      ))}
    </ol>
  )
}
