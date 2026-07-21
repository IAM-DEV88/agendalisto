---
description: >
  Ejecuta N rondas de mejora. Usa `/improve 5 quality` para 5 rondas
  de calidad, o `/improve quality` para 1 ronda.
agent: build
---

Ejecuta una o múltiples rondas de mejora en AgendaYa.

## Uso

```
/improve [N] <división>: <objetivo>
/improve quality: Eliminar código muerto        → 1 ronda
/improve 5 quality: Limpiar imports             → 5 rondas
/improve 3 performance: Agregar React.memo      → 3 rondas
```

## Mecanismo de loop

Si se especifica `N > 1`, al completar cada ronda el agente DEBE:

1. Actualizar `.opencode/improve/rounds.md` con lo hecho
2. Verificar que `pnpm type-check` pase
3. **Invocarse de nuevo con `task`** para la siguiente ronda, pasando:
   - Misma división y objetivo
   - Número de ronda actual / total (ej: "ronda 2 de 5")
   - Lo que ya se logró en rondas anteriores para no repetir

## Criterios de parada anticipada

El loop se detiene antes de N si:
- Una ronda completa 0 cambios (no hay más trabajo)
- `pnpm type-check` falla y no se puede corregir en 2 intentos
- Se detecta que el agente está repitiendo el mismo cambio

## Reglas

1. Leer `.opencode/improve/priorities.md` antes de empezar
2. Máximo 5 cambios por ronda
3. `pnpm type-check` después de CADA cambio
4. Si falla, revertir con `git checkout -- <file>` e intentar de otra forma
5. NO modificar `../supabase-shared/`
6. NO modificar tablas sin prefijo `agendaya_`
