// Paso 3: el cliente se registra con su número de celular.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { useStore } from '../../data/store.jsx'

export default function Registro() {
  const { registrarCliente, clientes } = useStore()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [celular, setCelular] = useState('')
  const [error, setError] = useState('')

  function enviar(e) {
    e.preventDefault()
    const limpio = celular.replace(/\D/g, '')
    if (limpio.length !== 10) {
      setError('El celular debe tener 10 dígitos, por ejemplo 3001234567.')
      return
    }
    if (!nombre.trim()) {
      setError('Escribe tu nombre para que la tienda te reconozca.')
      return
    }
    registrarCliente(nombre.trim(), limpio)
    navigate('/cliente/codigo')
  }

  function entrarComo(c) {
    registrarCliente(c.nombre, c.celular)
    navigate('/cliente/saldo')
  }

  return (
    <Layout rol="cliente" sinMenu>
      <h1 className="titulo">Crea tu cuenta de puntos</h1>
      <p className="bajada">Solo necesitas tu celular. No tienes que comprar criptomonedas ni guardar llaves.</p>

      <form className="formulario" onSubmit={enviar} noValidate>
        <label htmlFor="nombre">Tu nombre</label>
        <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />

        <label htmlFor="celular">Número de celular</label>
        <input
          id="celular"
          inputMode="numeric"
          placeholder="3001234567"
          value={celular}
          onChange={(e) => setCelular(e.target.value)}
          autoComplete="tel"
        />

        {error && <p className="error">{error}</p>}
        <button className="boton boton-grande" type="submit">Crear mi cuenta</button>
      </form>

      <div className="caja-aprende">
        <p>
          <strong>Qué pasa en Stellar:</strong> se crea una cuenta para ti en la red de pruebas. La red
          cobra una pequeña reserva por cada cuenta; la paga la red de tiendas (reserva patrocinada),
          no tú.
        </p>
      </div>

      <p className="ayuda">¿Ya tienes cuenta? Entra como:</p>
      <div className="chips">
        {clientes.map((c) => (
          <button key={c.id} type="button" className="chip" onClick={() => entrarComo(c)}>
            {c.nombre}
          </button>
        ))}
      </div>
    </Layout>
  )
}
