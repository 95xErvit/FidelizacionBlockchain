// Paso 3-4: el cliente obtiene su QR personal y lo muestra en el mostrador.
import { QRCodeSVG } from 'qrcode.react'
import Layout from '../../components/Layout.jsx'
import { RequiereCliente } from '../../components/RequiereSesion.jsx'
import { useStore } from '../../data/store.jsx'

function Contenido() {
  const { clienteActivoId, clientePorId, saldoDe } = useStore()
  const cliente = clientePorId(clienteActivoId)

  return (
    <Layout rol="cliente" subtitulo={cliente.nombre}>
      <h1 className="titulo">Muestra este código en la tienda</h1>
      <p className="bajada">El tendero lo escanea para darte puntos o para descontarlos de tu compra.</p>

      <div className="qr-marco">
        <QRCodeSVG value={cliente.celular} size={220} level="M" fgColor="#16213a" bgColor="#ffffff" />
        <p className="qr-numero">{cliente.celular.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}</p>
        <p className="qr-saldo">Saldo actual: {saldoDe(cliente.id)} puntos</p>
      </div>

      <div className="caja-aprende">
        <p>
          <strong>Qué pasa en Stellar:</strong> el código solo lleva tu celular. La app lo relaciona con
          tu cuenta <span className="codigo">{cliente.cuenta}</span>; tus datos personales nunca se
          escriben en la red.
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
