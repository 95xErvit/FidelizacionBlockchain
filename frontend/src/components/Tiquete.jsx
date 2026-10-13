// El saldo del cliente presentado como un tiquete de tienda con borde troquelado.
export default function Tiquete({ puntos, nombre, descuento }) {
  return (
    <section className="tiquete" aria-label={`Saldo: ${puntos} puntos`}>
      <div className="tiquete-cuerpo">
        <p className="tiquete-nombre">{nombre}</p>
        <p className="tiquete-cifra">
          {puntos}
          <span>puntos</span>
        </p>
        <p className="tiquete-nota">Equivalen a {descuento} de descuento en cualquier tienda aliada</p>
      </div>
    </section>
  )
}
