// ─────────────────────────────────────────────────────────────────────────────
// Configuración de red: "a qué Stellar nos conectamos".
// Para cambiar de red o de contrato solo se cambian las variables de entorno
// (.env.local en tu equipo, Settings → Environment Variables en Vercel).
// Vite reemplaza cada import.meta.env.VITE_… por su valor al compilar.
// ─────────────────────────────────────────────────────────────────────────────
const red = import.meta.env.VITE_STELLAR_NETWORK || 'testnet'

export const stellarConfig = Object.freeze({
  red,
  /** Nodo RPC: el puente HTTP entre la app y la blockchain */
  rpcUrl: import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  /** Identifica la red al firmar: una firma de testnet no sirve en mainnet */
  networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  /** Contrato de fidelización (contracts/contracts/fidelizacion) */
  contractId: import.meta.env.VITE_CONTRACT_ID || '',
  /** Cuenta con la que se simulan las LECTURAS (no firma ni paga nada) */
  cuentaLectura: import.meta.env.VITE_CUENTA_LECTURA || 'GAIRHYFIEYOVCZRTZVNO3I2T3DOAEUUWWFLBNOTKBWPG2BGSUYFFROFG',
  explorerUrl: `https://stellar.expert/explorer/${red}`,
  friendbotUrl: 'https://friendbot.stellar.org',
})

/** Regla comercial que no vive en el contrato: cuánto descuento da cada punto. */
export const DESCUENTO_POR_PUNTO = 50

export const enlaceTx = (hash) => `${stellarConfig.explorerUrl}/tx/${hash}`
export const enlaceContrato = () => `${stellarConfig.explorerUrl}/contract/${stellarConfig.contractId}`
export const enlaceCuenta = (g) => `${stellarConfig.explorerUrl}/account/${g}`
export const cortar = (texto, n = 4) => (texto ? `${texto.slice(0, n)}…${texto.slice(-n)}` : '')
