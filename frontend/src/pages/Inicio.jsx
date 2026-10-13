// Pantalla de entrada: se elige con qué rol recorrer la demo.
import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { useStore } from '../data/store.jsx'

export default function Inicio() {
  const { comercios, reiniciarDemo } = useStore()
  const aliadas = comercios.filter((c) => c.estado === 'aprobado').length

  return (
    <Layout rol={null} ancho="ancho">
      <section className="portada">
        <h1>Los puntos que ganas en una tienda del barrio, úsalos en otra.</h1>
        <p className="portada-texto">
          {aliadas} tiendas aliadas comparten un mismo programa de puntos. Cada entrega y cada
          redención queda registrada en la red de Stellar, así ninguna tienda puede cambiar el
          historial por su cuenta.
        </p>
      </section>

      <h2 className="titulo-seccion">Entrar como</h2>
      <div className="puertas">
        <Link to="/cliente" className="puerta puerta-cliente">
          <span className="puerta-rol">Cliente</span>
          <span className="puerta-texto">Regístrate con tu celular, muestra tu código y mira tus puntos.</span>
        </Link>
        <Link to="/tendero" className="puerta puerta-tendero">
          <span className="puerta-rol">Tendero</span>
          <span className="puerta-texto">Entrega puntos por cada compra y recibe los de otras tiendas.</span>
        </Link>
        <Link to="/admin" className="puerta puerta-admin">
          <span className="puerta-rol">Administrador</span>
          <span className="puerta-texto">Aprueba comercios y fija cuántos puntos puede entregar cada uno.</span>
        </Link>
      </div>

      <button type="button" className="enlace-discreto" onClick={reiniciarDemo}>
        Restablecer los datos de prueba
      </button>
    </Layout>
  )
}
