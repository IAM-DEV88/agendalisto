---
description: >
  Ejecuta una campaña de mejora: N rondas por cada agente en secuencia.
  Ej: `/campaign 5` → 5 rondas de quality, 5 de performance, 5 de architecture...
agent: build
---

Ejecuta una campaña completa de mejora recorriendo todos los agentes.

## Uso

```
/campaign [rondas-por-agente] [división-inicial]
/campaign 5              → 5 rondas de cada agente
/campaign 3 quality      → empieza en quality, 3 rondas cada uno
/campaign               → 1 ronda de cada agente (default)
```

## Orden de ejecución

1. **quality** — Tests, tipos, código muerto
2. **architecture** — Refactors, splits, monolitos
3. **reliability** — Error boundaries, fallbacks
4. **performance** — Memo, lazy loading, bundle
5. **ux** — Accesibilidad, responsive, i18n
6. **product** — Features, negocio

## Mecanismo

1. Leer `.opencode/improve/priorities.md` y `AGENTS.md` para contexto
2. Por cada división en orden:
   a. Ejecutar N rondas usando `task` para invocar al subagente correspondiente
   b. Después de cada ronda: actualizar `.opencode/improve/rounds.md`
   c. Validar con `pnpm type-check`
3. Al terminar todas las divisiones: mostrar resumen global

## Criterios de parada por división

Una división se salta si:
- La ronda anterior no encontró nada que cambiar
- El type-check falla 2 veces seguidas en la misma división
- El agente reporta "BLOQUEADO"

## Formato del log en rounds.md

```
# Campaña YYYY-MM-DD — 5 rondas por división

## quality (5/5 completadas)
- Ronda 1: eliminados 3 imports muertos
- Ronda 2: reemplazados 2 any por tipos
- ...

## architecture (3/5 — detenido por type-check fallido)
- Ronda 1: extraído api/businesses.ts
- Ronda 2: extraído api/appointments.ts
- Ronda 3: ❌ type-check falló, división detenida
```
