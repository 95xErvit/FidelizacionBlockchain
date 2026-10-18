#!/usr/bin/env bash
# Despliega el contrato de fidelización en la TESTNET de Stellar y deja
# evidencia en el explorador. Sirve también para redesplegar cuando la
# testnet se reinicia: se corre de nuevo y listo.
#
# Uso (desde la carpeta contracts/):   ./scripts/deploy-testnet.sh
# Requisitos: Rust + target wasm32v1-none + Stellar CLI (ver README.md)
set -euo pipefail

NETWORK=testnet
EXPLORER="https://stellar.expert/explorer/testnet"
PESOS_POR_PUNTO=1000      # 1 punto por cada $1.000 de compra
DIAS_VENCIMIENTO=180      # los puntos vencen tras 180 días sin actividad
# cliente_id de Camila Ospina (cliente de prueba ya registrado en la base de datos)
CLIENTE_DEMO="ea1606926d87406c1d0c4e1376c0945669c5eeb33c2e7a493201c2e1ecec2354"

cd "$(dirname "$0")/.."

# Extrae el hash de transacción de la salida de la CLI (si lo imprime).
tx_de() { grep -Eo '[0-9a-f]{64}' <<<"$1" | head -1 || true; }

echo "▶ 1/6 Cuentas de prueba (con fondos de friendbot)"
for cuenta in admin tienda-rosa panaderia; do
  if stellar keys address "$cuenta" >/dev/null 2>&1; then
    echo "   $cuenta ya existe: $(stellar keys address "$cuenta")"
  else
    stellar keys generate "$cuenta" --network "$NETWORK" --fund
    echo "   $cuenta creada: $(stellar keys address "$cuenta")"
  fi
  # Si la testnet se reinició, la cuenta existe en tu equipo pero no en la red: se vuelve a fondear.
  stellar keys fund "$cuenta" --network "$NETWORK" >/dev/null 2>&1 || true
done

echo "▶ 2/6 Compilando a WebAssembly"
stellar contract build

echo "▶ 3/6 Desplegando (constructor: admin, $PESOS_POR_PUNTO pesos/punto, $DIAS_VENCIMIENTO días)"
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/fidelizacion.wasm \
  --source-account admin \
  --network "$NETWORK" \
  --alias fidelizacion \
  -- \
  --admin admin \
  --pesos_por_punto "$PESOS_POR_PUNTO" \
  --dias_vencimiento "$DIAS_VENCIMIENTO" | tail -1)
echo "   Contract ID: $CONTRACT_ID"

invocar() { # invocar <cuenta-que-firma> <función> [args...]
  local fuente=$1; shift
  stellar contract invoke --id fidelizacion --source-account "$fuente" --network "$NETWORK" -- "$@" 2>&1
}

echo "▶ 4/6 Registrando comercios (firma: admin)"
OUT=$(invocar admin registrar_comercio --comercio tienda-rosa --limite_mensual 5000); TX_REG1=$(tx_de "$OUT")
OUT=$(invocar admin registrar_comercio --comercio panaderia --limite_mensual 3000);   TX_REG2=$(tx_de "$OUT")

CLIENTE="$CLIENTE_DEMO"
echo "▶ 5/6 Flujo demo con cliente_id $CLIENTE"
OUT=$(invocar tienda-rosa emitir_puntos --comercio tienda-rosa --cliente "$CLIENTE" --valor_compra 25500)
TX_EMITIR=$(tx_de "$OUT"); echo "   Doña Rosa entrega puntos por \$25.500 → $(tail -1 <<<"$OUT")"
OUT=$(invocar panaderia redimir --comercio panaderia --cliente "$CLIENTE" --puntos 10)
TX_REDIMIR=$(tx_de "$OUT"); echo "   Panadería redime 10 → saldo $(tail -1 <<<"$OUT")"
echo "   Saldo leído (sin firma): $(stellar contract invoke --id fidelizacion --source-account admin --network $NETWORK --send=no -- saldo --cliente "$CLIENTE")"

echo "▶ 6/6 Guardando evidencia en deploy-testnet.out.md"
{
  echo "# Despliegue en testnet — $(date '+%Y-%m-%d %H:%M')"
  echo
  echo "- Contrato: [$CONTRACT_ID]($EXPLORER/contract/$CONTRACT_ID)"
  echo "- Admin: \`$(stellar keys address admin)\`"
  echo "- Tienda Doña Rosa: \`$(stellar keys address tienda-rosa)\`"
  echo "- Panadería El Trigal: \`$(stellar keys address panaderia)\`"
  echo
  echo "| Acción | Transacción |"
  echo "|---|---|"
  for par in "Registrar Doña Rosa:$TX_REG1" "Registrar Panadería:$TX_REG2" "Emitir 25 puntos:$TX_EMITIR" "Redimir 10 puntos:$TX_REDIMIR"; do
    nombre=${par%%:*}; tx=${par#*:}
    if [ -n "$tx" ]; then echo "| $nombre | [$tx]($EXPLORER/tx/$tx) |"; else echo "| $nombre | ver historial del contrato |"; fi
  done
  echo
  echo "Para registrar estas transacciones en el historial (cuando la API esté publicada):"
  echo '```'
  for tx in "$TX_EMITIR" "$TX_REDIMIR"; do [ -n "$tx" ] && echo "curl -X POST https://fidelizacion-blockchain.vercel.app/api/movimientos -H 'Content-Type: application/json' -d '{\"txHash\":\"$tx\"}'"; done
  echo '```'
  echo
  echo "Para el front (\`frontend/.env.local\`):"
  echo '```'
  echo "VITE_CONTRACT_ID=$CONTRACT_ID"
  echo "VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org"
  echo "VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015"
  echo '```'
} > deploy-testnet.out.md

echo
echo "✅ Listo. Contrato: $EXPLORER/contract/$CONTRACT_ID"
echo "   Evidencia guardada en contracts/deploy-testnet.out.md"
