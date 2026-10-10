# Documentación Semana 3 — Red de Fidelización Blockchain

## 1. Front construido

### Pantallas o vistas implementadas

El front cubre el flujo principal del MVP definido en el Product Blueprint:
**registrar comercio → registrar cliente → registrar compra → asignar puntos → consultar saldo → redimir en comercio aliado → actualizar saldo → consultar historial.**

| Vista | Rol | Función en el MVP |
|---|---|---|
| Acceso / elección de rol | Todos | Entrar como tendero, cliente o administrador |
| Registro de comercio | Tendero | Dar de alta el comercio en la red |
| Registro/identificación de cliente | Cliente, tendero | Crear o reconocer la cuenta por teléfono/código |
| Registrar compra | Tendero | Registrar una compra elegible y asignar los puntos de la campaña |
| Consulta de saldo | Cliente | Ver puntos disponibles y condiciones de uso |
| Redención en comercio aliado | Cliente, tendero receptor | Solicitar, verificar y confirmar el uso de puntos |
| Historial de movimientos | Cliente, tendero | Ver compras, asignaciones, usos y ajustes |
| Panel del tendero | Tendero | Ver beneficios entregados, utilizados y clientes recurrentes |
| Administración de reglas | Administrador | Definir equivalencias, límites y vencimientos |

La lectura de saldos y del historial se hace en tiempo real desde la red de prueba de Stellar (testnet) a través de Horizon, usando `@stellar/stellar-sdk`. Los datos personales no se escriben en la red; solo perfiles, comercios y configuración.

**Capturas de pantalla:** [PENDIENTE — insertar capturas o el enlace del front desplegado (Vercel) aquí]

## 2. Decisión técnica

**Opción elegida: A — Contrato propio en Soroban.**

El contrato manejará la lógica de negocio que no puede delegarse a simples pagos de un activo nativo: emitir puntos validando reglas de campaña (`emitir_puntos`), redimir de forma atómica entre comercios (`redimir`), definir reglas compartidas en cadena (`definir_reglas`) y ejecutar vencimientos visibles (`vencer_puntos`).

Hace falta un contrato propio porque: (1) el Problem Brief exige reglas programables (impedir redenciones superiores al saldo y aplicar límites), y un pago nativo no ejecuta lógica condicional; (2) la redención inter-comercio requiere verificaciones y descuentos atómicos que solo un contrato garantiza en una sola operación; (3) al dejar las reglas en la red se reduce la concentración de confianza en el operador (Criterio 3 de pertinencia), y (4) es coherente con el Uso de Stellar del Blueprint, que ya identifica los contratos Soroban como la evolución para reglas de campaña.

Se descartó la Opción B (usar solo herramientas existentes del ecosistema: activo emitido + pagos con memo + Horizon) porque, sin contrato, no hay dónde programar las reglas de campaña, la redención entre comercios no es atómica y el control vuelve a depender exclusivamente del operador.

Esta semana no se escribe ni se despliega código de contrato; la decisión queda registrada y la implementación se entrega la semana 4 en testnet.

## 3. Participación del equipo

| Integrante | Usuario GitHub | Aporte en el entregable |
|---|---|---|
| Erik Villarreal | @95xErvit | Arquitectura e integración del front con Stellar (Horizon/testnet) |
| Esteban Ibarguen | @EstebannEsteban | Pantallas de tendero (registro de compra, panel) y desarrollo |
| German Ochoa | @germanoch-torac | Pantallas de cliente (saldo, redención), documentación y estrategia |

## 4. Bloqueos y siguiente paso

**Bloqueos actuales:** [PENDIENTE — describir incidencias encontradas durante la construcción del front]

**Siguiente paso:** implementar y desplegar en testnet el contrato Soroban (`emitir_puntos`, `definir_reglas`, `redimir`, `vencer_puntos`) y conectarlo al front ya construido.
