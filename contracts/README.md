# Contrato de fidelización (Soroban · Stellar testnet)

Contrato propio que guarda en la red los **saldos de puntos**, los **comercios aprobados** y las **reglas compartidas** de la red de tiendas. Es la implementación de la Opción A declarada en la semana 3.

## Qué hace cada función

| Función | Quién firma | Qué hace |
|---|---|---|
| `__constructor(admin, pesos_por_punto, dias_vencimiento)` | — (al desplegar) | Guarda el administrador y las reglas iniciales |
| `registrar_comercio(comercio, limite_mensual)` | Admin | Aprueba una tienda o cambia su límite (también la reactiva) |
| `desactivar_comercio(comercio)` | Admin | Saca una tienda de la red |
| `definir_reglas(pesos_por_punto, dias_vencimiento)` | Admin | Cambia la equivalencia pesos→punto y el vencimiento |
| `emitir_puntos(comercio, cliente, valor_compra)` | Tendero | Calcula los puntos con las reglas, valida el límite del mes y los suma al cliente |
| `redimir(comercio, cliente, puntos)` | Tendero que recibe | Descuenta los puntos en una sola operación; falla si no alcanza el saldo |
| `vencer_puntos(cliente)` | Cualquiera | Pasa a 0 un saldo que ya venció según las reglas |
| `saldo(cliente)` · `comercio(c)` · `emitidos_periodo(c)` · `reglas()` · `admin()` | Nadie (lectura) | Consultas gratis, sin firma |

**`cliente`** es un `cliente_id` de 32 bytes **aleatorio** que el backend le asigna a cada cliente al registrarse. No se puede deducir el celular a partir de él (un hash del celular sí se podría revertir probando todos los números). En la red no queda ningún dato personal: el nombre, el celular y la relación con el `cliente_id` viven en la base de datos.

**Eventos** que emite (para que el backend arme el historial): `ComercioRegistrado`, `PuntosEmitidos`, `PuntosRedimidos`, `PuntosVencidos`, `ReglasActualizadas`.

## Errores (el front los traduce a mensajes)

| Código | Error | Cuándo |
|---|---|---|
| `Error(Contract, #1)` | `ComercioNoRegistrado` | La cuenta no es una tienda de la red |
| `Error(Contract, #2)` | `ComercioInactivo` | La tienda fue desactivada |
| `Error(Contract, #3)` | `CompraInsuficiente` | La compra no alcanza para 1 punto |
| `Error(Contract, #4)` | `LimiteMensualSuperado` | La tienda ya entregó su cupo de los últimos 30 días |
| `Error(Contract, #5)` | `SaldoInsuficiente` | El cliente no tiene esos puntos |
| `Error(Contract, #6)` | `CantidadInvalida` | Se intentó redimir 0 puntos |
| `Error(Contract, #7)` | `ReglasInvalidas` | `pesos_por_punto` en 0 |
| `Error(Contract, #8)` | `NoHayPuntosVencidos` | Se pidió vencer un saldo que no ha vencido |

## Cómo correrlo

Requisitos: **Rust**, el target **`wasm32v1-none`** y la **Stellar CLI** (misma guía de la clase 1: `class-1/setup` del repo del curso).

```bash
rustup target add wasm32v1-none
brew install stellar-cli        # o: cargo install --locked stellar-cli
```

Desde esta carpeta (`contracts/`):

```bash
cargo test                       # 17 pruebas de las reglas de negocio
./scripts/deploy-testnet.sh      # crea cuentas, compila, despliega y hace un flujo demo
```

El script deja la evidencia (contract ID y enlaces a las transacciones en stellar.expert) en `deploy-testnet.out.md`.

> **La testnet se reinicia cada cierto tiempo.** Si el contrato desaparece, se corre de nuevo `./scripts/deploy-testnet.sh` y se actualiza `VITE_CONTRACT_ID` en el front.

### Invocar a mano

```bash
CLIENTE=ea1606926d87406c1d0c4e1376c0945669c5eeb33c2e7a493201c2e1ecec2354   # Camila (cliente de prueba)

stellar contract invoke --id fidelizacion --source-account tienda-rosa --network testnet -- \
  emitir_puntos --comercio tienda-rosa --cliente $CLIENTE --valor_compra 25500

stellar contract invoke --id fidelizacion --source-account admin --network testnet --send=no -- \
  saldo --cliente $CLIENTE
```

### Bindings para el front

```bash
stellar contract bindings typescript --network testnet --contract-id fidelizacion \
  --output-dir ../frontend/packages/fidelizacion --overwrite
```
