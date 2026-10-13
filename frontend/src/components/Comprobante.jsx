// Lo que se muestra cuando "la red confirma" una entrega o redención.
// Enseña qué quedará registrado en Stellar: memo, hash y quién envía a quién.
import { fechaCorta } from '../data/store.jsx'

export default function Comprobante({ movimiento, cliente, comercio, onNuevo }) {
  const esEntrega = movimiento.tipo === 'entrega'
  return (
    <div className={`comprobante ${esEntrega ? 'es-entrega' : 'es-redencion'}`} role="status">
      <p className="comprobante-titulo">
        {esEntrega ? `Entregaste ${movimiento.puntos} puntos` : `Se redimieron ${movimiento.puntos} puntos`}
      </p>
      <p className="comprobante-sub">
        {esEntrega ? `a ${cliente.nombre}` : `de ${cliente.nombre}`} en {comercio.nombre} · {fechaCorta(movimiento.fecha)}
      </p>
      <dl className="registro">
        <div>
          <dt>Operación en Stellar</dt>
          <dd>Pago del activo PUNTOS {esEntrega ? 'tienda → cliente' : 'cliente → tienda'}</dd>
        </div>
        <div>
          <dt>Memo</dt>
          <dd className="codigo">{movimiento.memo}</dd>
        </div>
        <div>
          <dt>Hash (simulado)</dt>
          <dd className="codigo hash">{movimiento.hash}</dd>
        </div>
      </dl>
      <button type="button" className="boton boton-secundario" onClick={onNuevo}>
        {esEntrega ? 'Atender otro cliente' : 'Hacer otra redención'}
      </button>
    </div>
  )
}
