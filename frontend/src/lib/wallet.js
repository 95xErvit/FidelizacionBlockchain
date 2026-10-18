// ─────────────────────────────────────────────────────────────────────────────
// WALLET · Stellar Wallets Kit (lo mismo que en la sesión 7)
//
// Una sola API para varias wallets (Freighter, xBull, Lobstr, Albedo, Hana).
// La app nunca ve claves privadas: pide la dirección y le pide a la wallet que
// firme. La llave no sale de la wallet.
// ─────────────────────────────────────────────────────────────────────────────
import { stellarConfig } from '../config/stellar.js'
import { TxError } from './errores.js'

let kitPromise = null

/** Carga el kit una sola vez (y solo cuando se necesita, para no pesar al inicio). */
function cargarKit() {
  kitPromise ??= (async () => {
    const [
      { StellarWalletsKit },
      { SwkAppLightTheme },
      { FreighterModule },
      { xBullModule },
      { LobstrModule },
      { AlbedoModule },
      { HanaModule },
    ] = await Promise.all([
      import('@creit.tech/stellar-wallets-kit/sdk'),
      import('@creit.tech/stellar-wallets-kit/types'),
      import('@creit.tech/stellar-wallets-kit/modules/freighter'),
      import('@creit.tech/stellar-wallets-kit/modules/xbull'),
      import('@creit.tech/stellar-wallets-kit/modules/lobstr'),
      import('@creit.tech/stellar-wallets-kit/modules/albedo'),
      import('@creit.tech/stellar-wallets-kit/modules/hana'),
    ])
    StellarWalletsKit.init({
      modules: [new FreighterModule(), new xBullModule(), new LobstrModule(), new AlbedoModule(), new HanaModule()],
      network: stellarConfig.networkPassphrase,
      theme: {
        ...SwkAppLightTheme,
        primary: '#2541b2',
        'primary-foreground': '#ffffff',
        'border-radius': '10px',
        'font-family': "'Atkinson Hyperlegible', system-ui, sans-serif",
      },
    })
    return StellarWalletsKit
  })()
  return kitPromise
}

/** Abre el selector de wallets y devuelve la dirección (G…) elegida. */
export async function conectarWallet() {
  const kit = await cargarKit()
  const { address } = await kit.authModal()
  return address
}

/** Recupera la sesión guardada por el kit (si el usuario ya se conectó antes). */
export async function restaurarWallet() {
  try {
    const kit = await cargarKit()
    const { address } = await kit.getAddress()
    return address || null
  } catch {
    return null
  }
}

export async function desconectarWallet() {
  const kit = await cargarKit()
  await kit.disconnect()
}

async function redDeLaWallet() {
  try {
    const kit = await cargarKit()
    const { networkPassphrase } = await kit.getNetwork()
    return networkPassphrase
  } catch {
    return null // algunas wallets no informan la red
  }
}

/**
 * FIRMA. La app arma la transacción y se la pasa a la wallet como XDR. La wallet
 * le muestra al usuario qué va a firmar y, si acepta, devuelve el XDR firmado.
 */
export async function firmarConWallet(xdr, address) {
  const red = await redDeLaWallet()
  if (red && red !== stellarConfig.networkPassphrase) {
    throw new TxError('red', `La wallet está en: ${red}`)
  }
  const kit = await cargarKit()
  return kit.signTransaction(xdr, { address, networkPassphrase: stellarConfig.networkPassphrase })
}

/** Friendbot regala XLM de prueba y, al hacerlo, crea la cuenta en testnet. */
export async function fondearConFriendbot(address) {
  const r = await fetch(`${stellarConfig.friendbotUrl}?addr=${address}`)
  if (!r.ok && r.status !== 400) throw new Error(`Friendbot respondió ${r.status}`) // 400 = ya tenía fondos
}
