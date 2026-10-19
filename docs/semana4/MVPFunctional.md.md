Qué incluye
Implementación de la Opción A declarada en la semana 3: contrato propio en Soroban, desplegado en testnet e integrado con el front y un backend.

Carpeta	Qué es
contracts/	Contrato de fidelización en Rust: emitir, redimir, límite mensual por tienda, reglas y vencimiento. 17 pruebas y script de despliegue en testnet
database/	Esquema de Supabase: clientes, comercios e historial (los datos personales no van a la cadena)
frontend/api/	Backend (funciones de Vercel): registra clientes y comercios y guarda el historial solo después de verificar cada transacción en la red. 27 pruebas
frontend/src/	El front ya no usa datos simulados: wallet con Stellar Wallets Kit (Freighter), firma real de emitir_puntos, redimir y registrar_comercio, estados de transacción y errores en lenguaje claro
Evidencia
Producto en vivo: https://fidelizacion-blockchain.vercel.app
Contrato: CD2DSWC6…OFVM
Entrega de 12 puntos firmada desde la app: dcd74f9b…
Redención de 5 puntos en otra tienda: eac56990…
Más transacciones en contracts/deploy-testnet.out.md
Cómo revisarlo
Abrir el enlace en vivo y entrar como Cliente → Camila Ospina: el saldo se lee del contrato y el historial enlaza a cada transacción.
Para probar como tienda o admin hace falta Freighter en Testnet con las cuentas de prueba (pedirlas a Esteban por privado). La guía de prueba narrada se comparte aparte.
Localmente: cd contracts && cargo test y cd frontend && npm install && npm test.
Pendiente antes de unir
 German: subir docs/semana4/MVPFunctional.md a esta rama con el enlace del video
 Erik: subir el README.md actualizado a esta rama
 Revisión y aprobación de Erik o German → Merge
You can view, comment on, or merge this pull request online at:
  https://github.com/95xErvit/FidelizacionBlockchain/pull/7

Commit Summary
09802d0 Contrato Soroban de fidelización desplegado en testnet + pruebas y script de despliegue
7df8869 Backend: API de clientes, comercios y movimientos verificados en la red + esquema de Supabase
d9f86a4 Front conectado: wallet (Stellar Wallets Kit), contrato en testnet y API; estados y errores de transacción
File Changes (54 files)
A contracts/.gitignore (4)
A contracts/Cargo.lock (2119)
A contracts/Cargo.toml (23)
A contracts/README.md (72)
A contracts/contracts/fidelizacion/Cargo.toml (15)
A contracts/contracts/fidelizacion/src/lib.rs (374)
A contracts/contracts/fidelizacion/src/test.rs (242)
A contracts/deploy-testnet.out.md (26)
A contracts/scripts/deploy-testnet.sh (97)
A database/esquema.sql (60)
A frontend/.env.example (14)
M frontend/.gitignore (2)
A frontend/api/README.md (61)
A frontend/api/_lib/http.js (52)
A frontend/api/_lib/index.js (6)
A frontend/api/_lib/repo.js (83)
A frontend/api/_lib/servicios.js (183)
A frontend/api/_lib/stellar.js (71)
A frontend/api/_test/http.test.js (71)
A frontend/api/_test/servicios.test.js (196)
A frontend/api/_test/stellar.test.js (72)
A frontend/api/clientes.js (9)
A frontend/api/comercios.js (22)
A frontend/api/movimientos.js (9)
A frontend/api/resumen.js (7)
A frontend/api/salud.js (15)
M frontend/package-lock.json (6777)
M frontend/package.json (6)
M frontend/src/components/BuscarCliente.jsx (57)
M frontend/src/components/Comprobante.jsx (34)
A frontend/src/components/EstadoTx.jsx (67)
M frontend/src/components/Layout.jsx (27)
M frontend/src/components/RequiereSesion.jsx (68)
A frontend/src/config/stellar.js (29)
M frontend/src/data/store.jsx (290)
A frontend/src/hooks/useCarga.js (23)
A frontend/src/hooks/useTx.js (57)
A frontend/src/lib/api.js (37)
A frontend/src/lib/contrato.js (105)
A frontend/src/lib/errores.js (63)
A frontend/src/lib/wallet.js (99)
M frontend/src/pages/Inicio.jsx (19)
M frontend/src/pages/admin/Red.jsx (136)
M frontend/src/pages/admin/Solicitudes.jsx (203)
M frontend/src/pages/cliente/MiCodigo.jsx (21)
M frontend/src/pages/cliente/Registro.jsx (57)
M frontend/src/pages/cliente/Saldo.jsx (51)
M frontend/src/pages/cliente/Tiendas.jsx (43)
M frontend/src/pages/tendero/ElegirTienda.jsx (114)
M frontend/src/pages/tendero/Entregar.jsx (79)
M frontend/src/pages/tendero/Redimir.jsx (176)
M frontend/src/pages/tendero/Reporte.jsx (34)
M frontend/src/styles.css (92)
M frontend/vite.config.js (31)
Patch Links:
https://github.com/95xErvit/FidelizacionBlockchain/pull/7.patch
https://github.com/95xErvit/FidelizacionBlockchain/pull/7.diff

Video: https://youtube.com/shorts/mmt4jFE3MXo

# FidelizacionBlockchain · Puntos del Barrio

Red de fidelización inter-comercio sobre Stellar: los puntos que un cliente gana en una tienda del barrio los usa en otra. Cada entrega y redención queda registrada en un contrato propio (Soroban) en la *testnet*.

1. Aprendizajes y ajustes priorizados

Construir el MVP confirmó que el valor está en quitarle fricción al tendero. Tres aprendizajes guiaron los ajustes:
Don Carlos no va a manejar llaves ni billeteras, así que la custodia delegada desde el backend es indispensable.

Las reglas de campaña deben vivir en el contrato Soroban propio, para que ningún comercio emita puntos sin respaldo.

Cada operación debe mostrar su prueba pública, porque la confianza entre comercios es la razón de usar blockchain.

Antes del cierre se hacen los ajustes: conectar todas las pantallas a la API real y mensajes de error comprensibles (saldo insuficiente, campaña vencida), porque de ellos depende que el flujo completo funcione y se pueda verificar. Quedan pendientes los ajustes: Panel del tendero con totales de puntos emitidos y redimidos y migrar las llaves custodiadas a un gestor seguro: mejoran la escala y la seguridad, pero no frenan la validación del piloto.

2. Riesgos y pendientes

Custodia delegada: Las llaves de comercios y clientes están en el backend
Baja adopción del tendero por falta de tiempo o de habilidad digital
Que los puntos se interpreten como medio de pago ante la regulación
Tratamiento de datos personales
Dependencia de que testnet y Friendbot estén disponibles
Contrato sin auditoría externa

Pendientes técnicos: pruebas unitarias automatizadas del contrato, una base de datos en lugar del archivo local, autenticación de usuarios en el front, monitoreo de errores y un tablero de métricas para el piloto.
Pendientes de negocio:
Elegir la zona y los primeros cinco comercios.
Definir el catálogo de beneficios de cada comercio.
Calcular el costo de operación por cliente fidelizado.
Acordar cómo se compensan los comercios cuando un cliente redime puntos en una tienda distinta a la que los dio.

3. Plan de validación con usuarios

A quiénes. Al usuario definido en el Problem Brief: los tenderos de barrio (persona "Don Carlos", 55 años, poca adopción digital) y sus clientes frecuentes. El piloto incluye entre 5 y 10 comercios de una misma zona y entre 50 y 100 clientes.
Hipótesis. Si los tenderos pueden dar puntos de forma sencilla y los clientes pueden usarlos en varios comercios, suben la participación, la frecuencia de compra y la retención, siempre que el costo de operación sea menor que el valor que se genera.
Métodos.
Pruebas de usabilidad moderadas (semana 1): cinco tenderos registran una compra y una redención sin ayuda. Se miden el tiempo, los errores y la comprensión.

Entrevistas semiestructuradas (semanas 1 y 4): sobre el valor que perciben, la confianza en los puntos de otros comercios y la disposición a pagar.

Piloto en operación real (4 semanas): el contrato registra los puntos dados y redimidos, y la frecuencia de compra se compara con una línea base de las dos semanas anteriores.

Encuesta corta a clientes (semana 4): satisfacción y probabilidad de recomendar.

Hipotesis y Supuestos 

El tendero da puntos de forma sencilla (Tiempo para registrar una compra) ≥ 80 % de los tenderos lo logran en menos de 30 segundos sin ayuda.
Los clientes participan (Clientes registrados que acumulan puntos) ≥ 60 % de los clientes invitados.
La red es interoperable (Redenciones en un comercio distinto al que dio los puntos) ≥ 20 % del total de redenciones.
Aumenta la frecuencia (Visitas por cliente al mes frente a la línea base) Aumento ≥ 15 % 
Aumenta la retención (Clientes recurrentes) ≥ 40 % de los clientes con dos o más compras en el periodo
El modelo es sostenible (Costo de operación por cliente fidelizado) Menor que el margen adicional generado

Decisión. Si se cumplen al menos cuatro de los seis criterios, se pasa a una segunda zona. Si no, se ajustan el flujo o las reglas de campaña y se repite el ciclo.

