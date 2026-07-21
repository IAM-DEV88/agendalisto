#!/usr/bin/env bash
# ─── Batch Campaign — N rondas por cada agente, headless ───
# Uso:   bash .opencode/batch-campaign.sh 10     # 10 rondas de cada agente
#        bash .opencode/batch-campaign.sh 5       # 5 rondas de cada agente
#
# Requisitos: opencode instalado, proyecto en git,
#             build con permission.task: allow
# ──────────────────────────────────────────────────────────────────────────────

set -e
ROUNDS=${1:-3}
DIVISIONS=("quality" "architecture" "reliability" "performance" "ux" "product")
LOG=".opencode/improve/rounds.md"
START=$(date +%s)
TOTAL_DIVISIONS=${#DIVISIONS[@]}

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         CAMPAÑA — $ROUNDS rondas × $TOTAL_DIVISIONS divisiones"
echo "║  Total estimado: $((ROUNDS * TOTAL_DIVISIONS)) rondas"
echo "║  Inicio: $(date)"
echo "╚════════════════════════════════════════════════════════════╝"

for DIV in "${DIVISIONS[@]}"; do
  echo ""
  echo "═══════════════════════════════════════"
  echo "  >>> $DIV — $ROUNDS rondas"
  echo "═══════════════════════════════════════"

  opencode run "/campaign $ROUNDS $DIV" 2>&1 || {
    echo "⚠️  Campaña detenida en $DIV. Continuando con la siguiente..."
    continue
  }

  echo "✅ $DIV completado"
  ELAPSED=$(( ($(date +%s) - START) / 60 ))
  echo "   Tiempo transcurrido: ${ELAPSED}min"
  sleep 3
done

TOTAL=$(( ($(date +%s) - START) / 60 ))
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🏁 CAMPAÑA COMPLETADA"
echo "║  $ROUNDS rondas × $TOTAL_DIVISIONS divisiones"
echo "║  Duración total: ${TOTAL} minutos"
echo "║  Revisá $LOG para detalles"
echo "╚════════════════════════════════════════════════════════════╝"
