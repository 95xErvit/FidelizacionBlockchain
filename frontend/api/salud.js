// GET /api/salud → revisa que la API tenga su configuración (útil después de desplegar)
import { ruta } from './_lib/http.js'
import { configStellar } from './_lib/stellar.js'

export default ruta({
  GET: () => {
    const { rpcUrl, contractId } = configStellar()
    return {
      ok: true,
      baseDeDatos: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY),
      contrato: contractId || null,
      rpc: rpcUrl,
    }
  },
})
