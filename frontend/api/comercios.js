// GET  /api/comercios                               → lista de comercios
// POST /api/comercios {nombre, barrio, responsable, cuenta}           → solicitud de un tendero
// POST /api/comercios?accion=sincronizar {id?, txHash}  → refleja registrar/desactivar firmado por el admin
// POST /api/comercios?accion=rechazar {id}              → rechaza una solicitud pendiente
import { ErrorApi, ruta } from './_lib/http.js'
import { servicios } from './_lib/index.js'

export default ruta({
  GET: () => servicios.listarComercios(),
  POST: ({ query, body }) => {
    switch (query.accion) {
      case undefined:
        return servicios.solicitarComercio(body)
      case 'sincronizar':
        return servicios.sincronizarComercio(body)
      case 'rechazar':
        return servicios.rechazarComercio(body)
      default:
        throw new ErrorApi(400, 'Acción desconocida')
    }
  },
})
