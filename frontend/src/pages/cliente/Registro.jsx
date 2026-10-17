// Paso 3: el cliente se registra con su número de celular (sin wallet).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { useStore } from '../../data/store.jsx'
import { api } from '../../lib/api.js'

const DE_PRUEBA = [
  { nombre: 'Camila Ospina', celular: '3001234567' },
  { nombre: 'Andrés Mejía', celular: '3109876543' },
]

export default function Registro() {
  const { iniciarCliente } = useStore()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [celular, setCelular] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function registrar(n, cel, destino) {
    setError('')
    setEnviando(true)
    try {
      const { cliente } = await api.registrarCliente(n, cel)
      iniciarCliente(cliente)
      navigate(destino)
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  function enviar(e) {
    e.preventDefault()
    const limpio = celular.replace(/\D/g, '')
    if (limpio.length !== 10) return setError('El celular debe tener 10 dígitos, por ejemplo 3001234567.')
    if (!nombre.trim()) return setError('Escribe tu nombre para que la tienda te reconozca.')
    registrar(nombre.trim(), limpio, '/cliente/codigo')
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
        <button className="boton boton-grande" type="submit" disabled={enviando}>
          {enviando ? 'Creando tu cuenta…' : 'Crear mi cuenta'}
        </button>
      </form>

      <div className="caja-aprende">
        <p>
          <strong>Qué pasa en Stellar:</strong> te asignamos un código anónimo de 64 caracteres. Tus puntos
          quedan guardados con ese código en el contrato de la red; tu nombre y tu celular nunca se escriben
          en la blockchain.
        </p>
      </div>

      <p className="ayuda">¿Ya tienes cuenta? Entra como:</p>
      <div className="chips">
        {DE_PRUEBA.map((c) => (
          <button key={c.celular} type="button" className="chip" disabled={enviando} onClick={() => registrar(c.nombre, c.celular, '/cliente/saldo')}>
            {c.nombre}
          </button>
        ))}
      </div>
    </Layout>
  )
}
