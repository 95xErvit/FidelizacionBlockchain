# Despliegue en testnet — 2026-10-17 12:07

- Contrato: [CD2DSWC6KSG64OTMF4Q4D2B2NFAZ4YXJDO7QXFY7NZXDM3P7LL3ZOFVM](https://stellar.expert/explorer/testnet/contract/CD2DSWC6KSG64OTMF4Q4D2B2NFAZ4YXJDO7QXFY7NZXDM3P7LL3ZOFVM)
- Admin: `GAIRHYFIEYOVCZRTZVNO3I2T3DOAEUUWWFLBNOTKBWPG2BGSUYFFROFG`
- Tienda Doña Rosa: `GBWM4KBJP2VZ62XQSM6M2ZQSI2VVNN7Q2FQMV6OYI3EBP6MCRRM7P5XB`
- Panadería El Trigal: `GBCOL6WKYWHWCS53UF3N4CLZISDM7YV3HZRQVN6DVAKXWTABH34L2AAP`

| Acción | Transacción |
|---|---|
| Registrar Doña Rosa | [7bda02174e3113045fe7da3123a51b9f38e18869c2d153dfbe504cc32093eb89](https://stellar.expert/explorer/testnet/tx/7bda02174e3113045fe7da3123a51b9f38e18869c2d153dfbe504cc32093eb89) |
| Registrar Panadería | [cc453e29f2cf57ec8d332c1b70bf7470e537c4e0c9887818be60a66defa1e737](https://stellar.expert/explorer/testnet/tx/cc453e29f2cf57ec8d332c1b70bf7470e537c4e0c9887818be60a66defa1e737) |
| Emitir 25 puntos | [0083d869ceb354081dc8365ad85ddb8c52c063970299fb51ca93699592caf92a](https://stellar.expert/explorer/testnet/tx/0083d869ceb354081dc8365ad85ddb8c52c063970299fb51ca93699592caf92a) |
| Redimir 10 puntos | [fd6b3769ebfdd2491bfeb919cd25c9d146624928e20193a211aa4c8ce81180a6](https://stellar.expert/explorer/testnet/tx/fd6b3769ebfdd2491bfeb919cd25c9d146624928e20193a211aa4c8ce81180a6) |

Para registrar estas transacciones en el historial (cuando la API esté publicada):
```
curl -X POST https://fidelizacion-blockchain.vercel.app/api/movimientos -H 'Content-Type: application/json' -d '{"txHash":"0083d869ceb354081dc8365ad85ddb8c52c063970299fb51ca93699592caf92a"}'
curl -X POST https://fidelizacion-blockchain.vercel.app/api/movimientos -H 'Content-Type: application/json' -d '{"txHash":"fd6b3769ebfdd2491bfeb919cd25c9d146624928e20193a211aa4c8ce81180a6"}'
```

Para el front (`frontend/.env.local`):
```
VITE_CONTRACT_ID=CD2DSWC6KSG64OTMF4Q4D2B2NFAZ4YXJDO7QXFY7NZXDM3P7LL3ZOFVM
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```
