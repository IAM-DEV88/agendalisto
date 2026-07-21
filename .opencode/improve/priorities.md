# Prioridades de Mejora — AgendaYa

Este documento define las divisiones, prioridades y reglas absolutas para todos los agentes de mejora del proyecto.

---

## Divisiones

| División | Enfoque | Agente | Prioridad |
|----------|---------|--------|-----------|
| **Quality** | Tests, tipos, código muerto, lint | `@quality` | 🔴 Crítica |
| **Architecture** | Refactors, splits, deuda técnica, monolitos | `@architecture` | 🔴 Crítica |
| **Reliability** | Error boundaries, fallbacks, edge cases, seguridad | `@reliability` | 🔴 Crítica |
| **Performance** | Bundle, memo, lazy loading, API paralelización | `@performance` | 🟡 Alta |
| **UX** | Accesibilidad, diseño responsive, consistencia | `@ux` | 🟡 Alta |
| **Product** | Features, integraciones, optimización de negocio | `@product` | 🟢 Media |

---

## Reglas ABSOLUTAS (aplican a TODOS los agentes)

### No tocar el ecosistema multi-app
- `../supabase-shared/` está FUERA del proyecto — no modificarlo
- `handle_new_user()`, `sanitize_signup_role()`, `ensure_user_app()` — canónicas en supabase-shared
- Tablas sin prefijo `agendaya_` — no tocarlas
- `agendaya_profiles` es la única fuente de verdad para roles

### Validación obligatoria post-cambio
```bash
pnpm type-check    # Sin errores NUEVOS
pnpm build         # Build exitoso
```
Si falla: revertir con `git checkout -- <file>` y reportar en el log.

### Límite por ronda
Máximo **5 cambios por ronda**. Después de 5, cerrar la ronda y reportar.

### Archivo de bitácora obligatorio
Mantener `.opencode/improve/rounds.md` con el formato definido en `commands/report.md`.

### Prohibiciones explícitas
- No cambiar `vite.config.ts` (usePolling, host, proxy)
- No modificar `package.json` sin verificar dependencias cruzadas
- No eliminar exports públicos de `src/lib/api.ts` sin migrar importadores
- No dejar `console.log` en producción
- No usar `any` en código nuevo

## Configuración necesaria en opencode.json

Para que los loops multi-ronda funcionen, agregá esto a `opencode.json`:

```json
{
  "subagent_depth": 20,
  "agent": {
    "improver": {
      "mode": "subagent",
      "permission": { "task": "allow", "edit": "allow", "bash": "allow" },
      "prompt": "Eres un ingeniero de mejora continua. Implementas cambios, validas con type-check, y te re-invocas hasta completar las rondas solicitadas."
    }
  }
}
```

Sin `subagent_depth >= 2` el agente NO puede re-invocarse a sí mismo.

## Límites prácticos

| Cantidad de rondas | Tiempo estimado | Costo estimado | Recomendación |
|--------------------|----------------|----------------|---------------|
| 1-5 | 5-25 min | $0.50-2 | Directo en chat con `/improve` |
| 5-20 | 25-100 min | $2-10 | Script headless |
| 20-100 | 2-8 horas | $10-50 | CI/CD semanal (GitHub Actions) |
| 100-1000 | 8-80 horas | $50-500 | ❌ Inviable en una sesión |

**1000 rondas no es práctico.** El cuello de botella no es técnico sino físico:
cada ronda requiere leer/analizar/modificar código, y el modelo tiene un
rendimiento de ~1-5 minutos por ronda. Para 1000 rondas necesitás ~80 horas
ininterrumpidas.

---

## Plan de Ejecución por Rondas

| Ronda | División | Objetivo | Depende de |
|-------|----------|----------|------------|
| 1 | Architecture | Dividir `src/lib/api.ts` en módulos | — |
| 2 | Reliability | Agregar Error Boundary en App.tsx | — |
| 3 | Quality | Eliminar código muerto (5 componentes, 7 deps) | — |
| 4 | Quality | Reemplazar `: any` por tipos concretos | — |
| 5 | Performance | Agregar React.memo + useMemo + useCallback | — |
| 6 | Performance | Parallelizar API calls secuenciales | — |
| 7 | Quality | Tests para api.ts (post-división) | Ronda 1 |
| 8 | UX | Accesibilidad: modales, aria, teclado | — |
| 9 | Performance | Lazy-loading leaflet, swiper | — |
| 10 | Reliability | Reemplazar fallback image externa por local | — |
