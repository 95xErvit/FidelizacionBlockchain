import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// En Vercel, cada archivo de /api es una función del servidor.
// En local (`npm run dev`) este plugin hace lo mismo, para no necesitar la CLI de Vercel.
function apiLocal() {
  return {
    name: 'api-local',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const nombre = req.url?.match(/^\/api\/([a-z-]+)(?:\?|$)/)?.[1]
        if (!nombre) return next()
        try {
          const modulo = await server.ssrLoadModule(`/api/${nombre}.js`)
          await modulo.default(req, res)
        } catch (e) {
          if (e?.code === 'ERR_LOAD_URL' || /Failed to load url/.test(e?.message)) return next()
          console.error('[api-local]', e)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Error interno del servidor' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Las variables sin prefijo VITE_ (llaves secretas) solo las ve la API, nunca el navegador.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return { plugins: [react(), apiLocal()] }
})
