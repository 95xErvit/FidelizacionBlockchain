// ─────────────────────────────────────────────────────────────────────────────
// ERRORES · De error técnico a mensaje que el tendero entiende
//
// Llegan de la wallet, del nodo RPC, del contrato o de nuestra API, cada uno en
// su formato. traducirError() los convierte en { titulo, mensaje, accion }.
// ─────────────────────────────────────────────────────────────────────────────

export class TxError extends Error {
  /** tipo: 'simulacion' | 'red' | 'rechazada' | 'fallida' | 'tiempo' | 'api' */
  constructor(tipo, mensaje, hash) {
    super(mensaje)
    this.tipo = tipo
    this.hash = hash
  }
}

// Los números son los de FidelizacionError en contracts/contracts/fidelizacion/src/lib.rs
const ERRORES_CONTRATO = {
  1: ['Esta tienda no es parte de la red', 'La cuenta conectada no está registrada como comercio. Pídele al administrador que la apruebe.'],
  2: ['Tienda desactivada', 'El administrador desactivó esta tienda; no puede entregar ni recibir puntos.'],
  3: ['Compra muy pequeña', 'La compra no alcanza para ganar ni un punto.'],
  4: ['Límite del mes alcanzado', 'Esta tienda ya entregó todos los puntos que puede este mes. Pídele al administrador que suba el límite.'],
  5: ['Saldo insuficiente', 'El cliente no tiene tantos puntos. Revisa su saldo e inténtalo con menos.'],
  6: ['Cantidad inválida', 'Escribe cuántos puntos quiere usar el cliente (más de cero).'],
  7: ['Regla inválida', 'Los pesos por punto deben ser mayores que cero.'],
  8: ['No hay puntos vencidos', 'Ese saldo todavía no ha vencido.'],
}

function describir(error) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) return String(error.message)
  return String(error)
}

export function traducirError(error) {
  const detalle = describir(error)
  const hay = (re) => re.test(detalle)
  const tipo = error instanceof TxError ? error.tipo : undefined
  const hash = error instanceof TxError ? error.hash : undefined
  const codigo = error && typeof error === 'object' && 'code' in error ? error.code : undefined
  const base = { detalle, hash }

  const contrato = detalle.match(/Error\(Contract, #(\d+)\)/)
  if (contrato && ERRORES_CONTRATO[contrato[1]]) {
    const [titulo, mensaje] = ERRORES_CONTRATO[contrato[1]]
    return { ...base, titulo, mensaje: `${mensaje} No se pidió ninguna firma ni se gastó nada.` }
  }
  if (codigo === -4 || hay(/reject|declin|denied|cancel|closed the modal/i))
    return { ...base, titulo: 'Firma cancelada', mensaje: 'Cancelaste la firma en la wallet. No se registró nada.', accion: 'reintentar' }
  if (hay(/Account not found|account entry is missing|not found.*account/i))
    return { ...base, titulo: 'Cuenta sin fondos', mensaje: 'Esta cuenta todavía no existe en testnet. Dale XLM de prueba con Friendbot.', accion: 'friendbot' }
  if (tipo === 'red' || hay(/network passphrase|wrong network/i))
    return { ...base, titulo: 'Wallet en otra red', mensaje: 'Tu wallet está en otra red. Cámbiala a Testnet en la configuración de Freighter.' }
  if (tipo === 'api')
    return { ...base, titulo: 'Quedó en la red, falta el historial', mensaje: `${detalle} La operación sí se registró en la blockchain.`, accion: 'reintentar' }
  if (tipo === 'tiempo' || hay(/timeout|timed out|Failed to fetch|Network ?Error|ECONN|50[234]/i))
    return { ...base, titulo: 'La red no respondió', mensaje: 'El nodo tardó demasiado o no está disponible. Prueba de nuevo en unos segundos.', accion: 'reintentar' }
  if (tipo === 'fallida' || tipo === 'rechazada')
    return { ...base, titulo: 'La red rechazó la transacción', mensaje: 'La transacción no se pudo ejecutar.', accion: 'reintentar' }
  if (tipo === 'simulacion')
    return { ...base, titulo: 'El contrato no aceptó la operación', mensaje: 'La simulación falló, así que no se pidió ninguna firma.' }
  return { ...base, titulo: 'Algo salió mal', mensaje: 'Ocurrió un error inesperado.', accion: 'reintentar' }
}
