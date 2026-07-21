---
description: Muestra el estado actual del proyecto y las próximas acciones recomendadas
agent: explore
---

Ejecuta un análisis rápido del estado actual de AgendaYa:

1. `!git status --short` — ver cambios sin commitear
2. `!git log --oneline -5` — últimos commits
3. Leer `.opencode/improve/rounds.md` si existe — últimas rondas
4. Leer `.opencode/improve/priorities.md` — plan general

Devuelve un resumen con:
- Rama actual
- Cambios sin commitear
- Últimas rondas de mejora
- Próxima ronda recomendada según priorities.md
