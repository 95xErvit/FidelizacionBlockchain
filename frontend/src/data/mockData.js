// Datos de prueba. Esta semana el front NO habla con Stellar todavía:
// todo vive aquí y en el navegador. La próxima semana estas funciones
// se reemplazan por llamadas reales a la testnet (activo de puntos, pagos con memo).

// Regla única del MVP (Blueprint, sección 4):
export const REGLAS = {
  pesosPorPunto: 1000, // 1 punto por cada $1.000 de compra
  descuentoPorPunto: 50, // cada punto redimido vale $50 de descuento
  codigoActivo: 'PUNTOS', // nombre del activo que se emitirá en Stellar
}

export const comerciosIniciales = [
  {
    id: 'm1',
    nombre: 'Tienda Doña Rosa',
    barrio: 'Belén',
    responsable: 'Rosa Gutiérrez',
    estado: 'aprobado',
    limiteMensual: 5000,
    cuenta: 'GDRO…4KQ2',
  },
  {
    id: 'm2',
    nombre: 'Panadería El Trigal',
    barrio: 'Laureles',
    responsable: 'Jorge Pineda',
    estado: 'aprobado',
    limiteMensual: 3000,
    cuenta: 'GTRI…9PLA',
  },
  {
    id: 'm3',
    nombre: 'Droguería La 33',
    barrio: 'Laureles',
    responsable: 'Marta Restrepo',
    estado: 'pendiente',
    limiteMensual: 2000,
    cuenta: null,
  },
]

export const clientesIniciales = [
  { id: 'c1', nombre: 'Camila Ospina', celular: '3001234567', cuenta: 'GCAM…7XQ4' },
  { id: 'c2', nombre: 'Andrés Mejía', celular: '3109876543', cuenta: 'GAND…2MZL' },
]

// Movimientos de ejemplo: cada uno equivale a un pago en Stellar con memo.
export const movimientosIniciales = [
  {
    id: 't1',
    tipo: 'entrega',
    clienteId: 'c1',
    comercioId: 'm1',
    puntos: 25,
    valorCompra: 25000,
    memo: 'ENT-TD-0001',
    hash: 'a3f9c1e2b7d84f60a1c9e5b2d7f3a8c6e1b9d4f7a2c5e8b3d6f9a1c4e7b2d5f8',
    fecha: '2026-10-05T15:20:00',
  },
  {
    id: 't2',
    tipo: 'entrega',
    clienteId: 'c1',
    comercioId: 'm2',
    puntos: 12,
    valorCompra: 12500,
    memo: 'ENT-PT-0001',
    hash: '7b2d5f8a3f9c1e2b7d84f60a1c9e5b2d7f3a8c6e1b9d4f7a2c5e8b3d6f9a1c4e',
    fecha: '2026-10-06T08:05:00',
  },
  {
    id: 't3',
    tipo: 'redencion',
    clienteId: 'c1',
    comercioId: 'm2',
    puntos: 10,
    valorCompra: null,
    memo: 'RED-PT-0001',
    hash: 'e1b9d4f7a2c5e8b3d6f9a1c4e7b2d5f8a3f9c1e2b7d84f60a1c9e5b2d7f3a8c6',
    fecha: '2026-10-07T18:40:00',
  },
  {
    id: 't4',
    tipo: 'entrega',
    clienteId: 'c2',
    comercioId: 'm1',
    puntos: 40,
    valorCompra: 40800,
    memo: 'ENT-TD-0002',
    hash: 'c5e8b3d6f9a1c4e7b2d5f8a3f9c1e2b7d84f60a1c9e5b2d7f3a8c6e1b9d4f7a2',
    fecha: '2026-10-08T11:15:00',
  },
]
