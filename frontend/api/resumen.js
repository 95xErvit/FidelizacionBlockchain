// GET /api/resumen → totales de la red (clientes, puntos emitidos y redimidos, por comercio)
import { ruta } from './_lib/http.js'
import { servicios } from './_lib/index.js'

export default ruta({
  GET: () => servicios.resumen(),
})
