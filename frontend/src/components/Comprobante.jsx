// Lo que se muestra cuando la red CONFIRMA una entrega o redención.
// Todo lo de aquí es real: la función del contrato, el hash y el enlace al explorador.
import { enlaceTx } from '../config/stellar.js'
import { fechaCorta } from '../data/store.jsx'

export default function Comprobante({ tipo, puntos, hash, saldoFinal, cliente, comercio, onNuevo, avisoHistorial }) {
  const esEntrega = tipo === 'entrega'
  return (
    <div className={`comprobante ${esEntrega ? 'es-entrega' : 'es-redencion'}`} role="status">
      <p className="comprobante-titulo">
        {esEntrega ? `Entregaste ${puntos} puntos` : `Se redimieron ${puntos} puntos`}
      </p>
      <p className="comprobante-sub">
        {esEntrega ? `a ${cliente.nombre}` : `de ${cliente.nombre}`} en {comercio.nombre} · {fechaCorta(new Date().toISOString())}
      </p>
      <dl className="registro">
        <div>
          <dt>Operación en el contrato</dt>
          <dd className="codigo">{esEntrega ? 'emitir_puntos' : 'redimir'}</dd>
        </div>
        {saldoFinal != null && (
          <div>
            <dt>Saldo del cliente en la red</dt>
            <dd>{saldoFinal} puntos</dd>
          </div>
        )}
        <div>
          <dt>Hash de la transacción</dt>
          <dd className="codigo hash">
            <a href={enlaceTx(hash)} target="_blank" rel="noreferrer">{hash}</a>
          </dd>
        </div>
      </dl>
      {avisoHistorial && <p className="aviso">{avisoHistorial}</p>}
      <button type="button" className="boton boton-secundario" onClick={onNuevo}>
        {esEntrega ? 'Atender otro cliente' : 'Hacer otra redención'}
      </button>
    </div>
  )
}
