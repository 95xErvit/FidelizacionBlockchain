//! Red de fidelización inter-comercio ("Puntos del Barrio").
//!
//! Qué guarda este contrato en la red:
//! - Los comercios aprobados por el administrador y su límite mensual de emisión.
//! - El saldo de puntos de cada cliente, identificado por un `cliente_id`
//!   anónimo (32 bytes aleatorios que asigna el backend). En la red NO hay
//!   nombres ni celulares.
//! - Las reglas compartidas de la red: cuántos pesos vale un punto y en
//!   cuántos días vencen los puntos sin actividad.
//!
//! Quién firma qué:
//! - Administrador: registrar/desactivar comercios y cambiar reglas.
//! - Tendero (la cuenta del comercio): emitir puntos y redimir puntos.
//! - Nadie: leer saldos, reglas y comercios (lecturas gratis).
#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error, Address,
    BytesN, Env,
};

// ── Tiempo ─────────────────────────────────────────────────────────────
const SEGUNDOS_POR_DIA: u64 = 86_400;
/// El límite de emisión se cuenta por periodos de 30 días.
const SEGUNDOS_POR_PERIODO: u64 = 30 * SEGUNDOS_POR_DIA;

// Los datos en Soroban pagan "alquiler": cada vez que se escriben se renueva ~30 días.
const DIA_EN_LEDGERS: u32 = 17_280;
const RENOVAR_HASTA: u32 = 30 * DIA_EN_LEDGERS;
const RENOVAR_SI_QUEDAN: u32 = RENOVAR_HASTA - DIA_EN_LEDGERS;

// ── Tipos ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Reglas {
    /// Pesos de compra necesarios para ganar 1 punto (ej. 1000).
    pub pesos_por_punto: u64,
    /// Días sin actividad tras los cuales vence el saldo (0 = nunca vence).
    pub dias_vencimiento: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Comercio {
    pub limite_mensual: u64,
    pub activo: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,                       // instance
    Reglas,                      // instance
    Comercio(Address),           // persistent
    Emitido(Address, u64),       // persistent: puntos emitidos por comercio en un periodo
    Saldo(BytesN<32>),            // persistent
    UltimaActividad(BytesN<32>),  // persistent: timestamp de la última emisión/redención
}

/// Códigos FIJOS: el front los traduce a mensajes (Error(Contract, #5) = saldo insuficiente).
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum FidelizacionError {
    ComercioNoRegistrado = 1,
    ComercioInactivo = 2,
    CompraInsuficiente = 3,
    LimiteMensualSuperado = 4,
    SaldoInsuficiente = 5,
    CantidadInvalida = 6,
    ReglasInvalidas = 7,
    NoHayPuntosVencidos = 8,
}

// ── Eventos (el backend los usa para armar el historial) ──────────────
#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ComercioRegistrado {
    #[topic]
    pub comercio: Address,
    pub limite_mensual: u64,
    pub activo: bool,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PuntosEmitidos {
    #[topic]
    pub comercio: Address,
    #[topic]
    pub cliente: BytesN<32>,
    pub puntos: u64,
    pub valor_compra: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PuntosRedimidos {
    #[topic]
    pub comercio: Address,
    #[topic]
    pub cliente: BytesN<32>,
    pub puntos: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PuntosVencidos {
    #[topic]
    pub cliente: BytesN<32>,
    pub puntos: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReglasActualizadas {
    pub pesos_por_punto: u64,
    pub dias_vencimiento: u64,
}

// ── Contrato ───────────────────────────────────────────────────────────
#[contract]
pub struct Fidelizacion;

#[contractimpl]
impl Fidelizacion {
    /// Se ejecuta una sola vez, al desplegar.
    pub fn __constructor(env: Env, admin: Address, pesos_por_punto: u64, dias_vencimiento: u64) {
        if pesos_por_punto == 0 {
            panic_with_error!(&env, FidelizacionError::ReglasInvalidas);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(
            &DataKey::Reglas,
            &Reglas { pesos_por_punto, dias_vencimiento },
        );
        renovar_instancia(&env);
    }

    // ── Administrador ──────────────────────────────────────────────────

    /// Aprueba un comercio o cambia su límite mensual (también lo reactiva).
    pub fn registrar_comercio(env: Env, comercio: Address, limite_mensual: u64) {
        admin(&env).require_auth();
        guardar_comercio(&env, &comercio, limite_mensual, true);
    }

    /// Saca un comercio de la red: ya no puede emitir ni redimir.
    pub fn desactivar_comercio(env: Env, comercio: Address) -> Result<(), FidelizacionError> {
        admin(&env).require_auth();
        let actual = leer_comercio(&env, &comercio)?;
        guardar_comercio(&env, &comercio, actual.limite_mensual, false);
        Ok(())
    }

    /// Cambia las reglas compartidas de la red.
    pub fn definir_reglas(
        env: Env,
        pesos_por_punto: u64,
        dias_vencimiento: u64,
    ) -> Result<(), FidelizacionError> {
        admin(&env).require_auth();
        if pesos_por_punto == 0 {
            return Err(FidelizacionError::ReglasInvalidas);
        }
        env.storage().instance().set(
            &DataKey::Reglas,
            &Reglas { pesos_por_punto, dias_vencimiento },
        );
        renovar_instancia(&env);
        ReglasActualizadas { pesos_por_punto, dias_vencimiento }.publish(&env);
        Ok(())
    }

    /// Pasa a cero el saldo de un cliente que lleva más días sin actividad
    /// que los que permiten las reglas. Cualquiera puede llamarla: solo
    /// hace algo si el vencimiento ya ocurrió según las reglas.
    pub fn vencer_puntos(env: Env, cliente: BytesN<32>) -> Result<u64, FidelizacionError> {
        let guardado = saldo_guardado(&env, &cliente);
        if guardado == 0 || !esta_vencido(&env, &cliente) {
            return Err(FidelizacionError::NoHayPuntosVencidos);
        }
        set_persistente(&env, &DataKey::Saldo(cliente.clone()), &0_u64);
        renovar_instancia(&env);
        PuntosVencidos { cliente, puntos: guardado }.publish(&env);
        Ok(guardado)
    }

    // ── Tendero ────────────────────────────────────────────────────────

    /// El comercio entrega puntos por una compra. Devuelve los puntos emitidos.
    pub fn emitir_puntos(
        env: Env,
        comercio: Address,
        cliente: BytesN<32>,
        valor_compra: u64,
    ) -> Result<u64, FidelizacionError> {
        comercio.require_auth(); // solo la cuenta del comercio puede emitir a su nombre
        let datos = comercio_activo(&env, &comercio)?;

        let puntos = valor_compra / reglas(&env).pesos_por_punto;
        if puntos == 0 {
            return Err(FidelizacionError::CompraInsuficiente);
        }

        let periodo = periodo_actual(&env);
        let clave_emitido = DataKey::Emitido(comercio.clone(), periodo);
        let emitido: u64 = env.storage().persistent().get(&clave_emitido).unwrap_or(0);
        if emitido + puntos > datos.limite_mensual {
            return Err(FidelizacionError::LimiteMensualSuperado);
        }

        // Si el saldo ya estaba vencido, empieza de cero antes de sumar.
        let saldo = saldo_vigente(&env, &cliente);
        set_persistente(&env, &clave_emitido, &(emitido + puntos));
        set_persistente(&env, &DataKey::Saldo(cliente.clone()), &(saldo + puntos));
        marcar_actividad(&env, &cliente);
        renovar_instancia(&env);

        PuntosEmitidos { comercio, cliente, puntos, valor_compra }.publish(&env);
        Ok(puntos)
    }

    /// El cliente usa puntos en un comercio aliado (puede ser otro distinto
    /// al que los entregó). Descuento atómico: o pasa completo o no pasa.
    /// Devuelve el saldo que le queda al cliente.
    pub fn redimir(
        env: Env,
        comercio: Address,
        cliente: BytesN<32>,
        puntos: u64,
    ) -> Result<u64, FidelizacionError> {
        comercio.require_auth();
        comercio_activo(&env, &comercio)?;
        if puntos == 0 {
            return Err(FidelizacionError::CantidadInvalida);
        }
        let saldo = saldo_vigente(&env, &cliente);
        if puntos > saldo {
            return Err(FidelizacionError::SaldoInsuficiente);
        }
        let nuevo = saldo - puntos;
        set_persistente(&env, &DataKey::Saldo(cliente.clone()), &nuevo);
        marcar_actividad(&env, &cliente);
        renovar_instancia(&env);

        PuntosRedimidos { comercio, cliente, puntos }.publish(&env);
        Ok(nuevo)
    }

    // ── Lecturas (no requieren firma) ──────────────────────────────────

    /// Saldo vigente (si ya venció, devuelve 0 aunque no se haya llamado vencer_puntos).
    pub fn saldo(env: Env, cliente: BytesN<32>) -> u64 {
        saldo_vigente(&env, &cliente)
    }

    pub fn comercio(env: Env, comercio: Address) -> Option<Comercio> {
        env.storage().persistent().get(&DataKey::Comercio(comercio))
    }

    /// Puntos que el comercio ya emitió en el periodo de 30 días actual.
    pub fn emitidos_periodo(env: Env, comercio: Address) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::Emitido(comercio, periodo_actual(&env)))
            .unwrap_or(0)
    }

    pub fn reglas(env: Env) -> Reglas {
        reglas(&env)
    }

    pub fn admin(env: Env) -> Address {
        admin(&env)
    }
}

// ── Ayudantes internos ────────────────────────────────────────────────

fn admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

fn reglas(env: &Env) -> Reglas {
    env.storage().instance().get(&DataKey::Reglas).unwrap()
}

fn periodo_actual(env: &Env) -> u64 {
    env.ledger().timestamp() / SEGUNDOS_POR_PERIODO
}

fn leer_comercio(env: &Env, comercio: &Address) -> Result<Comercio, FidelizacionError> {
    env.storage()
        .persistent()
        .get(&DataKey::Comercio(comercio.clone()))
        .ok_or(FidelizacionError::ComercioNoRegistrado)
}

fn comercio_activo(env: &Env, comercio: &Address) -> Result<Comercio, FidelizacionError> {
    let datos = leer_comercio(env, comercio)?;
    if !datos.activo {
        return Err(FidelizacionError::ComercioInactivo);
    }
    Ok(datos)
}

fn guardar_comercio(env: &Env, comercio: &Address, limite_mensual: u64, activo: bool) {
    set_persistente(
        env,
        &DataKey::Comercio(comercio.clone()),
        &Comercio { limite_mensual, activo },
    );
    renovar_instancia(env);
    ComercioRegistrado { comercio: comercio.clone(), limite_mensual, activo }.publish(env);
}

fn saldo_guardado(env: &Env, cliente: &BytesN<32>) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::Saldo(cliente.clone()))
        .unwrap_or(0)
}

fn esta_vencido(env: &Env, cliente: &BytesN<32>) -> bool {
    let dias = reglas(env).dias_vencimiento;
    if dias == 0 {
        return false;
    }
    let ultima: Option<u64> = env
        .storage()
        .persistent()
        .get(&DataKey::UltimaActividad(cliente.clone()));
    match ultima {
        Some(t) => env.ledger().timestamp() > t + dias * SEGUNDOS_POR_DIA,
        None => false,
    }
}

fn saldo_vigente(env: &Env, cliente: &BytesN<32>) -> u64 {
    if esta_vencido(env, cliente) {
        0
    } else {
        saldo_guardado(env, cliente)
    }
}

fn marcar_actividad(env: &Env, cliente: &BytesN<32>) {
    set_persistente(
        env,
        &DataKey::UltimaActividad(cliente.clone()),
        &env.ledger().timestamp(),
    );
}

fn set_persistente<V: soroban_sdk::IntoVal<Env, soroban_sdk::Val>>(
    env: &Env,
    key: &DataKey,
    value: &V,
) {
    env.storage().persistent().set(key, value);
    env.storage()
        .persistent()
        .extend_ttl(key, RENOVAR_SI_QUEDAN, RENOVAR_HASTA);
}

fn renovar_instancia(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(RENOVAR_SI_QUEDAN, RENOVAR_HASTA);
}

mod test;
