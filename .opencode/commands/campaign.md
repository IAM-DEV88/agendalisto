---
description: >
  Ejecuta N rondas por cada agente con un objetivo personalizado.
  Ej: `/campaign 5 "mejora la legibilidad del código"`
agent: build
---

Ejecuta una campaña de mejora recorriendo todos los agentes, cada uno aplicando el objetivo desde su perspectiva.

## Uso

```
/campaign [rondas] [división-inicio] "objetivo personalizado"
/campaign 5                                        → 1 ronda c/u, objetivo por defecto
/campaign 5 "elimina código muerto y mejora tipos" → 5 rondas c/u con objetivo custom
/campaign 3 quality "optimiza rendimiento"         → empieza en quality, 3 rondas c/u
/campaign "solo auditar, sin cambios"              → 1 ronda c/u en modo solo lectura
```

## Parámetros

- `$1` — Número de rondas por división (opcional, default: 1)
- `$2` — División inicial (opcional, ej: performance, default: quality)
- `$ARGUMENTS` — Todo el texto después del comando. Si contiene un string entre comillas, ese es el objetivo. Si no, se usa objetivo genérico.

## Objetivo personalizado

Si el usuario incluye un objetivo entre comillas `"..."`, ese objetivo debe ser pasado a CADA agente de división para que lo aborde desde su especialidad:

| División | Cómo interpreta el objetivo |
|----------|----------------------------|
| quality | "Aplica el objetivo priorizando tipos, tests y código muerto" |
| architecture | "Aplica el objetivo priorizando estructura, refactors y deuda técnica" |
| reliability | "Aplica el objetivo priorizando manejo de errores y robustez" |
| performance | "Aplica el objetivo priorizando velocidad y bundle" |
| ux | "Aplica el objetivo priorizando accesibilidad y experiencia de usuario" |
| product | "Aplica el objetivo priorizando features y valor de negocio" |

## Orden de ejecución

quality → architecture → reliability → performance → ux → product

## Mecanismo

1. Leer `.opencode/improve/priorities.md` y `AGENTS.md` para contexto
2. Parsear: extraer $1 (rondas), detectar si $2 es una división conocida y si hay objetivo entre comillas
3. Por cada división en orden:
   a. Invocar al subagente con `task`, pasándole: el objetivo (personalizado o genérico), el número de ronda, y la división.
   b. Leer el resultado, validar con `pnpm type-check`
   c. Actualizar `.opencode/improve/rounds.md`
4. Al terminar: mostrar resumen global

## Criterios de parada

- Si una ronda completa 0 cambios, saltar a la siguiente división
- Si type-check falla 2 veces seguidas, detener esa división
- Si el agente reporta "BLOQUEADO", saltar división
