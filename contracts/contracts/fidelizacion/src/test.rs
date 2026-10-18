#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, Ledger},
    BytesN, Env, IntoVal, Symbol,
};

const PESOS_POR_PUNTO: u64 = 1_000;
const DIAS_VENCIMIENTO: u64 = 180;

struct Escenario {
    env: Env,
    id: Address,
    admin: Address,
    tienda_rosa: Address,
    panaderia: Address,
    camila: BytesN<32>,
    client: FidelizacionClient<'static>,
}

/// Red con dos tiendas aprobadas (Doña Rosa: 5000/mes, Panadería: 3000/mes).
fn escenario() -> Escenario {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_760_000_000);

    let admin = Address::generate(&env);
    let id = env.register(Fidelizacion, (admin.clone(), PESOS_POR_PUNTO, DIAS_VENCIMIENTO));
    let client = FidelizacionClient::new(&env, &id);

    let tienda_rosa = Address::generate(&env);
    let panaderia = Address::generate(&env);
    client.registrar_comercio(&tienda_rosa, &5_000);
    client.registrar_comercio(&panaderia, &3_000);

    let camila = BytesN::from_array(&env, &[7u8; 32]);
    Escenario { env, id, admin, tienda_rosa, panaderia, camila, client }
}

#[test]
fn constructor_guarda_admin_y_reglas() {
    let e = escenario();
    assert_eq!(e.client.admin(), e.admin);
    assert_eq!(
        e.client.reglas(),
        Reglas { pesos_por_punto: PESOS_POR_PUNTO, dias_vencimiento: DIAS_VENCIMIENTO }
    );
}

#[test]
fn registrar_comercio_requiere_firma_del_admin() {
    let e = escenario();
    let nueva = Address::generate(&e.env);
    e.client.registrar_comercio(&nueva, &2_000);

    let (firmante, invocacion) = e.env.auths().pop().unwrap();
    assert_eq!(firmante, e.admin);
    assert_eq!(
        invocacion.function,
        AuthorizedFunction::Contract((
            e.id.clone(),
            Symbol::new(&e.env, "registrar_comercio"),
            (nueva.clone(), 2_000_u64).into_val(&e.env)
        ))
    );
    assert_eq!(
        e.client.comercio(&nueva),
        Some(Comercio { limite_mensual: 2_000, activo: true })
    );
}

#[test]
fn emitir_calcula_puntos_segun_reglas() {
    let e = escenario();
    // $25.500 de compra → 25 puntos (se redondea hacia abajo)
    let puntos = e.client.emitir_puntos(&e.tienda_rosa, &e.camila, &25_500);
    assert_eq!(puntos, 25);
    assert_eq!(e.client.saldo(&e.camila), 25);
    assert_eq!(e.client.emitidos_periodo(&e.tienda_rosa), 25);
}

#[test]
fn emitir_requiere_firma_del_comercio() {
    let e = escenario();
    e.client.emitir_puntos(&e.tienda_rosa, &e.camila, &10_000);

    let (firmante, _) = e.env.auths().pop().unwrap();
    assert_eq!(firmante, e.tienda_rosa);
}

#[test]
fn compra_menor_a_un_punto_falla() {
    let e = escenario();
    assert_eq!(
        e.client.try_emitir_puntos(&e.tienda_rosa, &e.camila, &999),
        Err(Ok(FidelizacionError::CompraInsuficiente))
    );
}

#[test]
fn comercio_no_registrado_no_puede_emitir() {
    let e = escenario();
    let intrusa = Address::generate(&e.env);
    assert_eq!(
        e.client.try_emitir_puntos(&intrusa, &e.camila, &50_000),
        Err(Ok(FidelizacionError::ComercioNoRegistrado))
    );
}

#[test]
fn no_se_puede_superar_el_limite_mensual() {
    let e = escenario();
    // La panadería tiene 3000 de límite: 2990 + 20 se pasa
    e.client.emitir_puntos(&e.panaderia, &e.camila, &2_990_000);
    assert_eq!(
        e.client.try_emitir_puntos(&e.panaderia, &e.camila, &20_000),
        Err(Ok(FidelizacionError::LimiteMensualSuperado))
    );
    // pero 10 todavía caben
    e.client.emitir_puntos(&e.panaderia, &e.camila, &10_000);
    assert_eq!(e.client.emitidos_periodo(&e.panaderia), 3_000);
}

#[test]
fn el_limite_se_reinicia_en_el_siguiente_periodo() {
    let e = escenario();
    e.client.emitir_puntos(&e.panaderia, &e.camila, &3_000_000);
    e.env.ledger().with_mut(|l| l.timestamp += 31 * 86_400);
    assert_eq!(e.client.emitidos_periodo(&e.panaderia), 0);
    e.client.emitir_puntos(&e.panaderia, &e.camila, &1_000);
}

#[test]
fn redimir_en_otro_comercio_descuenta_el_saldo() {
    let e = escenario();
    e.client.emitir_puntos(&e.tienda_rosa, &e.camila, &40_000); // 40 en Doña Rosa
    let queda = e.client.redimir(&e.panaderia, &e.camila, &15); // usa 15 en la panadería
    let (firmante, _) = e.env.auths().pop().unwrap();
    assert_eq!(firmante, e.panaderia); // firma el comercio que recibe los puntos

    assert_eq!(queda, 25);
    assert_eq!(e.client.saldo(&e.camila), 25);
}

#[test]
fn no_se_puede_redimir_mas_que_el_saldo() {
    let e = escenario();
    e.client.emitir_puntos(&e.tienda_rosa, &e.camila, &10_000);
    assert_eq!(
        e.client.try_redimir(&e.panaderia, &e.camila, &11),
        Err(Ok(FidelizacionError::SaldoInsuficiente))
    );
    assert_eq!(e.client.saldo(&e.camila), 10);
}

#[test]
fn redimir_cero_puntos_falla() {
    let e = escenario();
    assert_eq!(
        e.client.try_redimir(&e.panaderia, &e.camila, &0),
        Err(Ok(FidelizacionError::CantidadInvalida))
    );
}

#[test]
fn comercio_desactivado_no_puede_operar() {
    let e = escenario();
    e.client.emitir_puntos(&e.tienda_rosa, &e.camila, &10_000);
    e.client.desactivar_comercio(&e.panaderia);
    assert_eq!(
        e.client.try_redimir(&e.panaderia, &e.camila, &5),
        Err(Ok(FidelizacionError::ComercioInactivo))
    );
    // y vuelve a operar si el admin lo registra de nuevo
    e.client.registrar_comercio(&e.panaderia, &3_000);
    e.client.redimir(&e.panaderia, &e.camila, &5);
}

#[test]
fn definir_reglas_cambia_la_equivalencia() {
    let e = escenario();
    e.client.definir_reglas(&500, &90);
    assert_eq!(e.client.emitir_puntos(&e.tienda_rosa, &e.camila, &10_000), 20);
    assert_eq!(
        e.client.try_definir_reglas(&0, &90),
        Err(Ok(FidelizacionError::ReglasInvalidas))
    );
}

#[test]
fn los_puntos_vencen_sin_actividad() {
    let e = escenario();
    e.client.emitir_puntos(&e.tienda_rosa, &e.camila, &30_000);

    // Antes del vencimiento no se puede vencer
    e.env.ledger().with_mut(|l| l.timestamp += 100 * 86_400);
    assert_eq!(
        e.client.try_vencer_puntos(&e.camila),
        Err(Ok(FidelizacionError::NoHayPuntosVencidos))
    );
    assert_eq!(e.client.saldo(&e.camila), 30);

    // Después de 180 días sin actividad el saldo vigente es 0
    e.env.ledger().with_mut(|l| l.timestamp += 81 * 86_400);
    assert_eq!(e.client.saldo(&e.camila), 0);
    assert_eq!(
        e.client.try_redimir(&e.panaderia, &e.camila, &1),
        Err(Ok(FidelizacionError::SaldoInsuficiente))
    );
    assert_eq!(e.client.vencer_puntos(&e.camila), 30);
}

#[test]
fn la_actividad_renueva_el_vencimiento() {
    let e = escenario();
    e.client.emitir_puntos(&e.tienda_rosa, &e.camila, &30_000);
    e.env.ledger().with_mut(|l| l.timestamp += 170 * 86_400);
    e.client.redimir(&e.panaderia, &e.camila, &10); // actividad
    e.env.ledger().with_mut(|l| l.timestamp += 170 * 86_400);
    assert_eq!(e.client.saldo(&e.camila), 20);
}

#[test]
fn emitir_tras_vencimiento_empieza_de_cero() {
    let e = escenario();
    e.client.emitir_puntos(&e.tienda_rosa, &e.camila, &30_000);
    e.env.ledger().with_mut(|l| l.timestamp += 200 * 86_400);
    e.client.emitir_puntos(&e.tienda_rosa, &e.camila, &5_000);
    assert_eq!(e.client.saldo(&e.camila), 5);
}

#[test]
fn clientes_tienen_saldos_independientes() {
    let e = escenario();
    let andres = BytesN::from_array(&e.env, &[9u8; 32]);
    e.client.emitir_puntos(&e.tienda_rosa, &e.camila, &10_000);
    e.client.emitir_puntos(&e.tienda_rosa, &andres, &3_000);
    assert_eq!(e.client.saldo(&e.camila), 10);
    assert_eq!(e.client.saldo(&andres), 3);
}
