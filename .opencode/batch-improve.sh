#!/usr/bin/env bash
# ─── Batch Improver — Ejecuta N rondas de mejora headless ───
# Uso:   bash .opencode/batch-improve.sh 100 quality
#        bash .opencode/batch-improve.sh 50 architecture
#
# Requisitos: opencode instalado, proyecto en git, config con subagent_depth >= 3
# ──────────────────────────────────────────────────────────────────────────────

set -e
ROUNDS=${1:-5}
DIVISION=${2:-quality}
GOAL=${3:-"Mejora general automática"}
LOG=".opencode/improve/rounds.md"
START=$(date +%s)

echo "╔══════════════════════════════════════════╗"
echo "║  Batch Improver — $ROUNDS rondas de $DIVISION"
echo "║  Inicio: $(date)"
echo "╚══════════════════════════════════════════╝"

for i in $(seq 1 $ROUNDS); do
  ELAPSED=$(( ($(date +%s) - START) / 60 ))
  echo ""
  echo "─── Ronda $i de $ROUNDS ($ELAPSED min transcurridos) ───"

  opencode run "/improve $DIVISION: $GOAL (ronda $i de $ROUNDS)" 2>&1 || {
    echo "❌ Ronda $i falló. Revisar $LOG"
    exit 1
  }

  echo "✅ Ronda $i completada"
  sleep 2
done

TOTAL=$(( ($(date +%s) - START) / 60 ))
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Batch completo: $ROUNDS rondas en $TOTAL min"
echo "║  Revisá $LOG para detalles"
echo "╚══════════════════════════════════════════╝"
