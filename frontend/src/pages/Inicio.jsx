// Pantalla de entrada: se elige con qué rol entrar.
import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { useStore } from '../data/store.jsx'

export default function Inicio() {
  const { comercios, cargandoComercios, errorRed } = useStore()
  const aliadas = comercios.filter((c) => c.estado === 'aprobado').length

  return (
    <Layout rol={null} ancho="ancho">
      <section className="portada">
        <h1>Los puntos que ganas en una tienda del barrio, úsalos en otra.</h1>
        <p className="portada-texto">
          {cargandoComercios ? 'Varias' : aliadas} tiendas aliadas comparten un mismo programa de puntos. Cada
          entrega y cada redención queda registrada en un contrato en la red de Stellar, así ninguna tienda puede
          cambiar el historial ni los saldos por su cuenta.
        </p>
        {errorRed && <p className="error">{errorRed}</p>}
      </section>

      <h2 className="titulo-seccion">Entrar como</h2>
      <div className="puertas">
        <Link to="/cliente" className="puerta puerta-cliente">
          <span className="puerta-rol">Cliente</span>
          <span className="puerta-texto">Regístrate con tu celular, muestra tu código y mira tus puntos. Sin wallet.</span>
        </Link>
        <Link to="/tendero" className="puerta puerta-tendero">
          <span className="puerta-rol">Tendero</span>
          <span className="puerta-texto">Conecta la wallet de tu tienda para entregar y recibir puntos.</span>
        </Link>
        <Link to="/admin" className="puerta puerta-admin">
          <span className="puerta-rol">Administrador</span>
          <span className="puerta-texto">Aprueba comercios y fija cuántos puntos puede entregar cada uno.</span>
        </Link>
      </div>
    </Layout>
  )
}
