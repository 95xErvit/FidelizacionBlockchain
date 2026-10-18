// Reemplaza el escaneo del QR: el tendero digita el celular o el código del QR.
// La búsqueda va a la API (los datos personales viven en la base, no en la red).
import { useState } from 'react'
import { api } from '../lib/api.js'

const DE_PRUEBA = [
  { nombre: 'Camila Ospina', celular: '3001234567' },
  { nombre: 'Andrés Mejía', celular: '3109876543' },
]

export default function BuscarCliente({ onEncontrado }) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)

  async function buscar(valor) {
    setError('')
    setBuscando(true)
    try {
      const { cliente } = await api.buscarCliente(valor)
      onEncontrado(cliente)
    } catch (e) {
      setError(e.status === 404 ? 'No hay ningún cliente con ese dato. Pídele que se registre primero en la app.' : e.message)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="buscar">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          buscar(texto)
        }}
        className="campo-con-boton"
      >
        <label htmlFor="cel">Celular del cliente o código del QR</label>
        <div>
          <input id="cel" placeholder="3001234567" value={texto} onChange={(e) => setTexto(e.target.value)} />
          <button className="boton" type="submit" disabled={buscando || !texto.trim()}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}
      <p className="ayuda">Clientes de prueba:</p>
      <div className="chips">
        {DE_PRUEBA.map((c) => (
          <button key={c.celular} type="button" className="chip" disabled={buscando} onClick={() => buscar(c.celular)}>
            {c.nombre}
          </button>
        ))}
      </div>
    </div>
  )
}
