// ─────────────────────────────────────────────────────────────────────────────
// INVOCAR EL CONTRATO de fidelización
//
// LEER  (saldo, reglas…): el nodo RPC SIMULA la llamada. No hay firma ni costo.
// ESCRIBIR (emitir, redimir…): transacción firmada. El ciclo completo es
//   1. construir → 2. simular → 3. firmar (wallet) → 4. enviar → 5. confirmar
// ─────────────────────────────────────────────────────────────────────────────
import {
  Account, Address, BASE_FEE, Contract, TransactionBuilder, nativeToScVal, rpc, scValToNative,
} from '@stellar/stellar-sdk'
import { stellarConfig } from '../config/stellar.js'
import { TxError } from './errores.js'

const servidor = new rpc.Server(stellarConfig.rpcUrl)
const contrato = () => new Contract(stellarConfig.contractId)

// ── Conversión de argumentos a tipos del contrato ──
const cuenta = (g) => new Address(g).toScVal()
const bytes32 = (hex) => nativeToScVal(Uint8Array.from(hex.match(/../g).map((b) => parseInt(b, 16))), { type: 'bytes' })
const u64 = (n) => nativeToScVal(BigInt(Math.trunc(n)), { type: 'u64' })

/** Convierte lo que devuelve el contrato a JS (u64 → number). */
function aJs(valor) {
  if (typeof valor === 'bigint') return Number(valor)
  if (Array.isArray(valor)) return valor.map(aJs)
  if (valor && typeof valor === 'object' && !(valor instanceof Uint8Array)) {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, aJs(v)]))
  }
  return valor
}

function armar(fuente, funcion, args) {
  return new TransactionBuilder(fuente, { fee: BASE_FEE, networkPassphrase: stellarConfig.networkPassphrase })
    .addOperation(contrato().call(funcion, ...args))
    .setTimeout(60)
    .build()
}

// ── Lectura ──────────────────────────────────────────────────────────────────
async function leer(funcion, ...args) {
  const tx = armar(new Account(stellarConfig.cuentaLectura, '0'), funcion, args)
  const sim = await servidor.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(sim)) throw new TxError('simulacion', sim.error)
  return sim.result?.retval ? aJs(scValToNative(sim.result.retval)) : null
}

export const leerSaldo = (clienteId) => leer('saldo', bytes32(clienteId))
export const leerReglas = () => leer('reglas')
export const leerAdmin = () => leer('admin')
export const leerComercio = (g) => leer('comercio', cuenta(g))
export const leerEmitidosPeriodo = (g) => leer('emitidos_periodo', cuenta(g))

// ── Escritura ────────────────────────────────────────────────────────────────
/**
 * @param firmante  cuenta G… que firma y paga la comisión
 * @param opciones  { firmar(xdr, address), alPaso(paso) } — el servicio no conoce la wallet
 * @returns { hash, retorno }
 */
async function escribir(firmante, funcion, args, { firmar, alPaso }) {
  // 1 + 2. Construir y simular. Si el contrato va a rechazarla (p. ej. saldo
  // insuficiente → Error(Contract, #5)) nos enteramos aquí, SIN pedir firma.
  alPaso('simulando')
  const fuente = await servidor.getAccount(firmante)
  let preparada
  try {
    preparada = await servidor.prepareTransaction(armar(fuente, funcion, args))
  } catch (e) {
    throw new TxError('simulacion', e?.message || String(e))
  }

  // 3. Firmar en la wallet.
  alPaso('esperando-firma')
  const { signedTxXdr } = await firmar(preparada.toXDR(), firmante)

  // 4. Enviar.
  alPaso('enviando')
  const firmada = TransactionBuilder.fromXDR(signedTxXdr, stellarConfig.networkPassphrase)
  const envio = await servidor.sendTransaction(firmada)
  if (envio.status === 'ERROR' || envio.status === 'TRY_AGAIN_LATER') {
    throw new TxError('rechazada', `La red respondió ${envio.status}`, envio.hash)
  }

  // 5. Esperar la confirmación del ledger (~5 s). "Enviada" no es "confirmada".
  alPaso('confirmando')
  const resultado = await servidor.pollTransaction(envio.hash, { attempts: 30 })
  if (resultado.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    throw new TxError('tiempo', 'No llegó la confirmación a tiempo', envio.hash)
  }
  if (resultado.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new TxError('fallida', 'La transacción falló al ejecutarse', envio.hash)
  }
  return { hash: envio.hash, retorno: resultado.returnValue ? aJs(scValToNative(resultado.returnValue)) : null }
}

export const emitirPuntos = (comercio, clienteId, valorCompra, op) =>
  escribir(comercio, 'emitir_puntos', [cuenta(comercio), bytes32(clienteId), u64(valorCompra)], op)

export const redimirPuntos = (comercio, clienteId, puntos, op) =>
  escribir(comercio, 'redimir', [cuenta(comercio), bytes32(clienteId), u64(puntos)], op)

export const registrarComercio = (admin, cuentaComercio, limite, op) =>
  escribir(admin, 'registrar_comercio', [cuenta(cuentaComercio), u64(limite)], op)

export const desactivarComercio = (admin, cuentaComercio, op) =>
  escribir(admin, 'desactivar_comercio', [cuenta(cuentaComercio)], op)
