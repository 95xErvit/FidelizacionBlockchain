// Prueba que el backend lee bien una transacción real del SDK de Stellar
// (construida aquí mismo, sin conectarse a la red).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  Account, Address, Contract, Keypair, Networks, TransactionBuilder, nativeToScVal, Operation,
} from '@stellar/stellar-sdk'
import { leerInvocacion, verificarTx } from '../_lib/stellar.js'

const CONTRATO = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
const tendero = Keypair.random()
const CLIENTE_HEX = 'ea1606926d87406c1d0c4e1376c0945669c5eeb33c2e7a493201c2e1ecec2354'

function sobre(operacion) {
  const cuenta = new Account(tendero.publicKey(), '1')
  return new TransactionBuilder(cuenta, { fee: '100', networkPassphrase: Networks.TESTNET })
    .addOperation(operacion)
    .setTimeout(30)
    .build()
    .toEnvelope()
}

test('lee contrato, función y argumentos de emitir_puntos', () => {
  const op = new Contract(CONTRATO).call(
    'emitir_puntos',
    new Address(tendero.publicKey()).toScVal(),
    nativeToScVal(Buffer.from(CLIENTE_HEX, 'hex'), { type: 'bytes' }),
    nativeToScVal(25500n, { type: 'u64' }),
  )
  const inv = leerInvocacion(sobre(op))
  assert.equal(inv.contrato, CONTRATO)
  assert.equal(inv.funcion, 'emitir_puntos')
  assert.deepEqual(inv.args, [tendero.publicKey(), CLIENTE_HEX, 25500])
})

test('una operación que no llama a un contrato devuelve null', () => {
  assert.equal(leerInvocacion(sobre(Operation.bumpSequence({ bumpTo: '5' }))), null)
})

test('verificarTx rechaza un hash mal formado sin llamar a la red', async () => {
  await assert.rejects(() => verificarTx('xyz', { rpcUrl: 'http://no', contractId: CONTRATO }), { status: 400 })
})

test('verificarTx exige que haya un contrato configurado', async () => {
  await assert.rejects(() => verificarTx('a'.repeat(64), { rpcUrl: 'http://no', contractId: '' }), { status: 500 })
})

test('también lee transacciones envueltas en fee bump (comisión patrocinada)', () => {
  const op = new Contract(CONTRATO).call(
    'redimir',
    new Address(tendero.publicKey()).toScVal(),
    nativeToScVal(Buffer.from(CLIENTE_HEX, 'hex'), { type: 'bytes' }),
    nativeToScVal(10n, { type: 'u64' }),
  )
  const interna = new TransactionBuilder(new Account(tendero.publicKey(), '1'), { fee: '100', networkPassphrase: Networks.TESTNET })
    .addOperation(op).setTimeout(30).build()
  interna.sign(tendero)
  const patrocinador = Keypair.random()
  const feeBump = TransactionBuilder.buildFeeBumpTransaction(patrocinador, '1000', interna, Networks.TESTNET)
  const inv = leerInvocacion(feeBump.toEnvelope())
  assert.equal(inv.funcion, 'redimir')
  assert.deepEqual(inv.args, [tendero.publicKey(), CLIENTE_HEX, 10])
})

test('lee el sobre tal como lo entrega el RPC (desde base64)', async () => {
  const { xdr } = await import('@stellar/stellar-sdk')
  const tx = new TransactionBuilder(new Account(tendero.publicKey(), '1'), { fee: '100', networkPassphrase: Networks.TESTNET })
    .addOperation(new Contract(CONTRATO).call('saldo', nativeToScVal(Buffer.from(CLIENTE_HEX, 'hex'), { type: 'bytes' })))
    .setTimeout(30).build()
  const desdeRed = xdr.TransactionEnvelope.fromXdr(tx.toXDR(), 'base64')
  assert.equal(leerInvocacion(desdeRed).funcion, 'saldo')
})
