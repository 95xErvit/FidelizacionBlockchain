# FidelizacionBlockchain · Puntos del Barrio

Red de fidelización entre comercios locales sobre Stellar. Los clientes acumulan puntos en una tienda y los redimen en otra. Las entregas y redenciones se ejecutan en un contrato propio de Soroban y quedan registradas en la testnet.

- **Aplicación:** [fidelizacion-blockchain.vercel.app](https://fidelizacion-blockchain.vercel.app)
- **Contrato en testnet:** [CD2DSWC6...OFVM](https://stellar.expert/explorer/testnet/contract/CD2DSWC6KSG64OTMF4Q4D2B2NFAZ4YXJDO7QXFY7NZXDM3P7LL3ZOFVM)
- **MVP funcional:** [docs/semana4/MVPFunctional.md](docs/semana4/MVPFunctional.md)
- **Evidencia de despliegue:** [contracts/deploy-testnet.out.md](contracts/deploy-testnet.out.md)

## Estructura

| Carpeta | Contenido |
|---|---|
| `contracts/` | Contrato Soroban en Rust, pruebas y script para desplegarlo en testnet. |
| `frontend/` | Aplicación React con Vite, conexión de wallet e integración con el contrato. Incluye las funciones API de Vercel en `frontend/api/`. |
| `database/` | Esquema SQL de Supabase para clientes, comercios y movimientos. |
| `docs/` | Entregables y documentación del proyecto por semana. |

## Cómo funciona

| Componente | Responsabilidad |
|---|---|
| Contrato (`contracts/`) | Mantiene los saldos, los comercios aprobados, sus límites y las reglas. Impide redimir más puntos de los disponibles o emitir por encima del límite. |
| Aplicación (`frontend/src/`) | El tendero conecta su wallet y firma las operaciones para entregar o redimir puntos. El administrador firma el registro de comercios. Los clientes consultan sus puntos con su celular, sin necesitar una wallet. |
| API (`frontend/api/`) | Conserva en Supabase los datos personales y el historial. Antes de guardar un movimiento, verifica en Stellar que la transacción corresponda al contrato y a una operación válida. |

Los datos personales no se escriben en la blockchain. Cada cliente se representa en el contrato con un identificador aleatorio de 32 bytes; su nombre, celular y relación con ese identificador permanecen en la base de datos.

## Requisitos

- Node.js 18 o posterior y npm.
- Para compilar y desplegar el contrato: Rust, el target `wasm32v1-none` y Stellar CLI.
- Para el script de despliegue en Windows, usar Git Bash o WSL.

## Ejecutar localmente

Desde la raíz del repositorio:

```bash
cd frontend
cp .env.example .env.local
```

Completa `VITE_CONTRACT_ID` y `SUPABASE_SECRET_KEY` en `frontend/.env.local`. El ejemplo ya incluye la URL de Supabase y la configuración de Stellar testnet. No agregues el prefijo `VITE_` a `SUPABASE_SECRET_KEY`: es un secreto que solo debe usar la API del servidor.

Después, instala dependencias, ejecuta las pruebas de la API e inicia la aplicación:

```bash
npm install
npm test
npm run dev
```

La aplicación queda disponible en http://localhost:5173. En desarrollo, Vite también sirve las funciones de `frontend/api/` bajo `/api`.

## Probar el contrato

Desde la raíz del repositorio:

```bash
cd contracts
cargo test
./scripts/deploy-testnet.sh
```

El script compila y despliega el contrato, ejecuta un flujo de demostración y escribe los IDs y enlaces de las transacciones en `contracts/deploy-testnet.out.md`. Al desplegar un contrato nuevo, actualiza `VITE_CONTRACT_ID` en `frontend/.env.local`.

Para probar las operaciones con wallet, instala Freighter, selecciona **Testnet** e importa las cuentas de prueba. Consulta [contracts/README.md](contracts/README.md) y [frontend/api/README.md](frontend/api/README.md) para más detalles.

> Este proyecto opera en la testnet de Stellar. Las cuentas y los puntos son de prueba; no tienen valor real.
