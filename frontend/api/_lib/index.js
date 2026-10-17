// Servicios listos para usar con la base real y la red real.
import { repoSupabase } from './repo.js'
import { crearServicios } from './servicios.js'
import { verificarTx } from './stellar.js'

export const servicios = crearServicios({ repo: repoSupabase, verificarTx })
