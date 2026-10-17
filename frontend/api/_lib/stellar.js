// Verificación de transacciones contra la red (Soroban RPC).
//
// El backend NUNCA confía en lo que le dice el navegador: el front solo manda
// el hash de la transacción y aquí se consulta a la red qué función del
// contrato se ejecutó, con qué argumentos y qué devolvió.
import { Address, rpc, scValToNative } from '@stellar/stellar-sdk'
import { ErrorApi } from './http.js'

export const configStellar = () => ({
  rpcUrl: process.env.STELLAR_RPC_URL || process.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  contractId: process.env.CONTRACT_ID || process.env.VITE_CONTRACT_ID || '',
})

/** Convierte valores del contrato a JSON: bytes → hex, u64 (bigint) → number. */
export function aNativo(valor) {
  if (valor instanceof Uint8Array) return Buffer.from(valor).toString('hex')
  if (typeof valor === 'bigint') return Number(valor)
  if (Array.isArray(valor)) return valor.map(aNativo)
  return valor
}

/**
 * Lee de un TransactionEnvelope la invocación al contrato:
 * { contrato: 'C…', funcion: 'emitir_puntos', args: [...] } o null si no es una.
 */
export function leerInvocacion(envelope) {
  // SDK 17: los tipos XDR son objetos con propiedades (no métodos).
  // Sobre normal: envelope.value.tx · Fee bump: envelope.value.tx.innerTx.value.tx
  const externo = envelope?.value?.tx
  const tx = externo?.innerTx ? externo.innerTx.value?.tx : externo
  const operaciones = tx?.operations
  if (!operaciones || operaciones.length !== 1) return null
  const invocacion = operaciones[0].body?.invokeHostFunctionOp?.hostFunction?.invokeContract
  if (!invocacion) return null
  const nombre = invocacion.functionName
  return {
    contrato: Address.fromScAddress(invocacion.contractAddress).toString(),
    funcion: nombre?.bytes ? Buffer.from(nombre.bytes).toString('utf8') : String(nombre),
    args: invocacion.args.map((a) => aNativo(scValToNative(a))),
  }
}

/**
 * Busca la transacción en la red y confirma que sea una llamada exitosa a
 * NUESTRO contrato. Devuelve { funcion, args, retorno, ledger, fecha }.
 */
export async function verificarTx(txHash, config = configStellar()) {
  if (!/^[0-9a-f]{64}$/.test(txHash || '')) throw new ErrorApi(400, 'txHash inválido')
  if (!config.contractId) throw new ErrorApi(500, 'Falta configurar VITE_CONTRACT_ID')

  const servidor = new rpc.Server(config.rpcUrl)
  const tx = await servidor.getTransaction(txHash)

  if (tx.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    throw new ErrorApi(404, 'La transacción todavía no aparece en la red. Intenta de nuevo en unos segundos.')
  }
  if (tx.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new ErrorApi(422, 'La transacción falló en la red; no se registra.')
  }
  const invocacion = leerInvocacion(tx.envelopeXdr)
  if (!invocacion || invocacion.contrato !== config.contractId) {
    throw new ErrorApi(422, 'La transacción no corresponde al contrato de fidelización.')
  }
  return {
    funcion: invocacion.funcion,
    args: invocacion.args,
    retorno: tx.returnValue ? aNativo(scValToNative(tx.returnValue)) : null,
    ledger: tx.ledger,
    fecha: new Date(tx.createdAt * 1000).toISOString(),
  }
}
