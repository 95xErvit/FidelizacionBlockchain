# Entregable 4 · Functional MVP — Puntos del Barrio

## Qué incluye

Implementación de la Opción A declarada en la semana 3: contrato propio en Soroban, desplegado en testnet e integrado con el front y un backend.

| Carpeta | Qué es |
|---|---|
| `contracts/` | Contrato de fidelización en Rust: emitir, redimir, límite mensual por tienda, reglas y vencimiento. 17 pruebas y script de despliegue en testnet |
| `database/` | Esquema de Supabase: clientes, comercios e historial (los datos personales no van a la cadena) |
| `frontend/api/` | Backend (funciones de Vercel): registra clientes y comercios y guarda el historial solo después de verificar cada transacción en la red. 27 pruebas |
| `frontend/src/` | El front ya no usa datos simulados: wallet con Stellar Wallets Kit (Freighter), firma real de `emitir_puntos`, `redimir` y `registrar_comercio`, estados de transacción y errores en lenguaje claro |

## Evidencia

- **Producto en vivo:** https://fidelizacion-blockchain.vercel.app
- **Contrato:** [CD2DSWC6…OFVM](https://stellar.expert/explorer/testnet/contract/CD2DSWC6KSG64OTMF4Q4D2B2NFAZ4YXJDO7QXFY7NZXDM3P7LL3ZOFVM)
- **Entrega de 12 puntos firmada desde la app:** dcd74f9b…
- **Redención de 5 puntos en otra tienda:** eac56990…
- **Más transacciones en** [`contracts/deploy-testnet.out.md`](https://github.com/95xErvit/FidelizacionBlockchain/blob/main/contracts/deploy-testnet.out.md)
- **Video:** https://youtube.com/shorts/ltsez6AYKT8

## Cómo revisarlo

1. Abrir el enlace en vivo y entrar como **Cliente → Camila Ospina**: el saldo se lee del contrato y el historial enlaza a cada transacción.
2. Para probar como tienda o admin hace falta Freighter en Testnet con las cuentas de prueba (pedirlas a Esteban por privado). La guía de prueba narrada se comparte aparte.
3. Localmente: `cd contracts && cargo test` y `cd frontend && npm install && npm test`.

Pull request: [#7](https://github.com/95xErvit/FidelizacionBlockchain/pull/7)

### Resumen de commits

| Commit | Descripción |
|---|---|
| `09802d0` | Contrato Soroban de fidelización desplegado en testnet + pruebas y script de despliegue |
| `7df8869` | Backend: API de clientes, comercios y movimientos verificados en la red + esquema de Supabase |
| `d9f86a4` | Front conectado: wallet (Stellar Wallets Kit), contrato en testnet y API; estados y errores de transacción |

**Enlaces del parche:** [pull/7.patch](https://github.com/95xErvit/FidelizacionBlockchain/pull/7.patch) · [pull/7.diff](https://github.com/95xErvit/FidelizacionBlockchain/pull/7.diff)

---

**Repositorio:** [95xErvit/FidelizacionBlockchain](https://github.com/95xErvit/FidelizacionBlockchain) · **App:** [fidelizacion-blockchain.vercel.app](https://fidelizacion-blockchain.vercel.app) · **Contrato (testnet):** [CD2DSWC6…OFVM](https://stellar.expert/explorer/testnet/contract/CD2DSWC6KSG64OTMF4Q4D2B2NFAZ4YXJDO7QXFY7NZXDM3P7LL3ZOFVM)

##**Video**: https://youtube.com/shorts/ltsez6AYKT8

*Lo construido esta semana:** implementamos la Opción A del Entregable 3, un contrato propio en Soroban (`contracts/`). Tiene 17 pruebas y está desplegado en testnet, con funciones para registrar comercios, emitir puntos, redimir, aplicar el límite mensual por tienda, definir reglas y vencer puntos. Agregamos un backend con funciones de Vercel (`frontend/api/`) que guarda los movimientos en Supabase solo después de verificar cada transacción en la red. El front ya no usa datos simulados: conecta la wallet con Stellar Wallets Kit y Freighter, firma de verdad las operaciones `emitir_puntos`, `redimir` y `registrar_comercio`, y traduce los errores del contrato a lenguaje claro.

---

## 1. Aprendizajes y ajustes priorizados

1. **La confianza se verifica, no se declara.** El backend no le cree al navegador: recibe solo el `txHash`, consulta la red y descarta cualquier transacción que haya fallado o sea de otro contrato.
2. **La privacidad debe estar en el diseño.** Un hash del celular se podría revertir. Por eso cada cliente usa un `cliente_id` aleatorio de 32 bytes, y el nombre y el celular quedan solo en Supabase (Ley 1581 de 2012).
3. **Las reglas deben vivir en el contrato.** Ahí están los pesos por punto (1.000), el vencimiento (180 días) y el límite mensual por tienda, para que ningún comercio emita sin control.
4. **La fricción del tendero sigue siendo el reto.** Pedirle a Don Carlos que instale Freighter es una barrera real.

| Prioridad | Ajuste | Impacto | Esfuerzo | Momento |
|---|---|---|---|---|
| 1 | Enlace al explorador en cada movimiento y mensajes de error claros | Alto | Bajo | Antes del cierre (hecho) |
| 2 | Publicar la evidencia (contrato, transacciones, video) en README y docs | Alto | Bajo | Antes del cierre (hecho) |
| 3 | Aprobar Droguería La 33 en el contrato para completar las 3 tiendas | Medio | Bajo | Antes del cierre |
| 4 | Verificar el celular del cliente con OTP | Alto | Medio | Pendiente |
| 5 | Experiencia del tendero sin extensión de navegador (passkeys o cuentas inteligentes) | Alto | Alto | Pendiente |
| 6 | Tarea automática para llamar `vencer_puntos` | Medio | Medio | Pendiente |

---

## 2. Riesgos y pendientes

| Riesgo | Probabilidad | Impacto | Mitigación / estado |
|---|---|---|---|
| El tendero no adopta la wallet (Freighter exige un computador con extensión y manejar llaves) | Alta | Alto | Acompañamiento en el piloto; evaluar passkeys o cuentas inteligentes de Stellar |
| Suplantación del cliente: hoy se registra y se consulta solo con el celular, sin verificarlo | Media | Alto | Agregar OTP por SMS antes de abrir el piloto |
| Reinicio periódico de la testnet: borra el contrato y deja huérfano el historial en Supabase | Media | Medio | El script `deploy-testnet.sh` vuelve a desplegar en minutos; respaldar las cuentas de demo |
| Base de datos y blockchain desincronizadas, si una transacción se confirma pero el `POST /api/movimientos` falla | Media | Medio | El endpoint es idempotente por `tx_hash`; falta una tarea que reindexe los eventos del contrato |
| Exposición de secretos (`SUPABASE_SECRET_KEY`) | Baja | Alto | Solo en variables del servidor de Vercel, sin prefijo `VITE_`; RLS activo en todas las tablas |
| Contrato sin auditoría externa | Media | Alto | 17 pruebas de reglas y errores; auditoría antes de mainnet |
| Interpretación regulatoria de los puntos como medio de pago | Baja | Alto | Puntos sin valor monetario ni convertibles a dinero; términos según la Ley 1480 de 2011 |
| Compensación entre comercios cuando un cliente redime en una tienda distinta a la que dio los puntos | Media | Alto | Sin definir; es un acuerdo de negocio previo al piloto |

**Pendientes técnicos:** OTP para clientes, autenticación del panel de administración y un proceso automático de vencimiento. También faltan el reindexado de eventos desde la red, el monitoreo de errores y un tablero de métricas del piloto. Los puntos solo vencen cuando alguien llama `vencer_puntos`, así que hoy un saldo vencido sigue apareciendo hasta que se ejecute.

**Pendientes de negocio:** elegir la zona y los comercios del piloto, definir el catálogo de beneficios, acordar la compensación entre tiendas y calcular el costo de operación por cliente fidelizado.

---

## 3. Plan de validación con usuarios

**A quiénes.** Al usuario del Problem Brief: tenderos de barrio con baja adopción digital (persona "Don Carlos", 55 años) y sus clientes frecuentes, como Camila. El piloto reúne de 5 a 10 comercios de una misma zona de Medellín (Belén y Laureles) y de 50 a 100 clientes.

**Hipótesis principal.** Si el tendero puede dar y redimir puntos en segundos y el cliente puede usarlos en cualquier tienda aliada, aumentan la frecuencia de compra y la retención. Esto vale siempre que el costo de operar la red sea menor que el valor que genera.

**Métodos.**
1. **Pruebas de usabilidad moderadas** (semana 1): cinco tenderos usan la app en vivo para registrar una compra y una redención sin ayuda. Medimos tiempo, errores y en qué paso de la wallet se traban.
2. **Entrevistas semiestructuradas** (semanas 1 y 4): exploran la confianza en los puntos de otras tiendas, la percepción del límite mensual y la disposición a pagar.
3. **Piloto real de 4 semanas:** las métricas salen directo de los eventos del contrato (`PuntosEmitidos`, `PuntosRedimidos`) y de `/api/resumen`. Se comparan con una línea base de dos semanas.
4. **Encuesta corta a clientes** (semana 4): satisfacción e intención de recomendar.

| Hipótesis | Métrica | Criterio de éxito |
|---|---|---|
| El tendero opera la app solo | Tiempo para entregar puntos | ≥ 80 % lo logra en menos de 30 s sin ayuda |
| La wallet no es una barrera | Tenderos que conectan Freighter solos | ≥ 70 % |
| Los clientes participan | Invitados que acumulan puntos | ≥ 60 % |
| La red es interoperable | Redenciones en una tienda distinta a la que dio los puntos | ≥ 20 % |
| Sube la frecuencia | Visitas por cliente al mes frente a la línea base | Aumento ≥ 15 % |
| El modelo es sostenible | Costo por cliente fidelizado | Menor que el margen adicional |

**Decisión.** Con 4 de los 6 criterios cumplidos, escalamos a una segunda zona. Si falla el criterio de la wallet, priorizamos la migración a passkeys antes de cualquier otro paso.
