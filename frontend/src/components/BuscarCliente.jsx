// Reemplaza el escaneo del QR: el tendero digita el celular o toca un cliente de prueba.
// (Escanear con la cámara queda para después; el QR contiene el mismo celular.)
import { useState } from 'react'
import { useStore } from '../data/store.jsx'

export default function BuscarCliente({ onEncontrado }) {
  const { buscarCliente, clientes } = useStore()
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')

  function buscar(e) {
    e.preventDefault()
    const c = buscarCliente(texto)
    if (!c) {
      setError('No hay ningún cliente con ese celular. Pídele que se registre primero en la app.')
      return
    }
    setError('')
    onEncontrado(c)
  }

  return (
    <div className="buscar">
      <form onSubmit={buscar} className="campo-con-boton">
        <label htmlFor="cel">Celular del cliente o código del QR</label>
        <div>
          <input
            id="cel"
            inputMode="numeric"
            placeholder="3001234567"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button className="boton" type="submit">Buscar</button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}
      <p className="ayuda">Simular escaneo:</p>
      <div className="chips">
        {clientes.map((c) => (
          <button key={c.id} type="button" className="chip" onClick={() => onEncontrado(c)}>
            {c.nombre}
          </button>
        ))}
      </div>
    </div>
  )
}
