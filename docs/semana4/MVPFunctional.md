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

