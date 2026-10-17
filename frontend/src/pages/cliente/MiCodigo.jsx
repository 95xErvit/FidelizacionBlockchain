// Paso 3-4: el cliente muestra su QR en el mostrador.
import { QRCodeSVG } from 'qrcode.react'
import Layout from '../../components/Layout.jsx'
import { RequiereCliente } from '../../components/RequiereSesion.jsx'
import { cortar } from '../../config/stellar.js'
import { useStore } from '../../data/store.jsx'
import { useCarga } from '../../hooks/useCarga.js'
import { leerSaldo } from '../../lib/contrato.js'

function Contenido() {
  const { cliente } = useStore()
  const saldo = useCarga(() => leerSaldo(cliente.clienteId), [cliente.clienteId])

  return (
    <Layout rol="cliente" subtitulo={cliente.nombre}>
      <h1 className="titulo">Muestra este código en la tienda</h1>
      <p className="bajada">El tendero lo escanea para darte puntos o para descontarlos de tu compra.</p>

      <div className="qr-marco">
        <QRCodeSVG value={cliente.id} size={220} level="M" fgColor="#16213a" bgColor="#ffffff" />
        <p className="qr-numero">{cliente.celular.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}</p>
        <p className="qr-saldo">
          Saldo en la red: {saldo.cargando ? '…' : saldo.error ? 'no disponible' : `${saldo.datos} puntos`}
        </p>
      </div>

      <div className="caja-aprende">
        <p>
          <strong>Qué pasa en Stellar:</strong> el QR solo lleva un código interno. La app lo relaciona con tu
          identificador anónimo en el contrato (<span className="codigo">{cortar(cliente.clienteId, 6)}</span>); tus
          datos personales nunca se escriben en la red.
        </p>
      </div>
    </Layout>
  )
}

export default function MiCodigo() {
  return (
    <RequiereCliente>
      <Contenido />
    </RequiereCliente>
  )
}
