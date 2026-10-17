// Llamadas al backend propio (/api). Todas devuelven JSON o lanzan Error con
// el mensaje que preparó el servidor.
async function pedir(ruta, opciones = {}) {
  const r = await fetch(`/api/${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  })
  let datos = {}
  try {
    datos = await r.json()
  } catch {
    /* respuesta vacía */
  }
  if (!r.ok) {
    const e = new Error(datos.error || `El servidor respondió ${r.status}`)
    e.status = r.status
    throw e
  }
  return datos
}

export const api = {
  registrarCliente: (nombre, celular) => pedir('clientes', { method: 'POST', body: { nombre, celular } }),
  buscarCliente: (texto) => pedir(`clientes?buscar=${encodeURIComponent(texto)}`),

  comercios: () => pedir('comercios'),
  solicitarComercio: (datos) => pedir('comercios', { method: 'POST', body: datos }),
  sincronizarComercio: (id, txHash) => pedir('comercios?accion=sincronizar', { method: 'POST', body: { id, txHash } }),
  rechazarComercio: (id) => pedir('comercios?accion=rechazar', { method: 'POST', body: { id } }),

  registrarMovimiento: (txHash) => pedir('movimientos', { method: 'POST', body: { txHash } }),
  movimientosCliente: (clienteId) => pedir(`movimientos?clienteId=${clienteId}`),
  movimientosComercio: (comercioId) => pedir(`movimientos?comercioId=${comercioId}`),

  resumen: () => pedir('resumen'),
}
