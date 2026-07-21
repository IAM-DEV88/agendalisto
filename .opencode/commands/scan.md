---
description: Escanea el códigobase en busca de deuda técnica (solo lectura, sin cambios)
agent: explore
---

Ejecuta una auditoría de solo lectura sobre el códigobase de AgendaYa. NO hagas cambios.

Busca específicamente:

1. **Archivos >400 líneas** — Listar con línea exacta de conteo.
2. **`$ARGUMENTS`** si se especifica (ej: `/scan quality` para solo calidad, `/scan performance` para solo rendimiento).
3. **Código muerto**: imports sin usar, componentes sin importar, variables sin usar.
4. **`: any` y `as any`** — Todas las ocurrencias con archivo y línea.
5. **`console.log` en producción** (excluir console.error).
6. **Missing `loading="lazy"`** en imágenes below the fold.
7. **Funciones sin tipos de retorno** explícitos.

Usa `!` para comandos bash y `@` para referencias a archivos.

Devuelve un resumen estructurado con:
```
## Resultados del escaneo
### Críticos (N encontrados)
- ...

### Altos (N encontrados)
- ...

### Medios (N encontrados)
- ...

### Recomendación para próxima ronda
- ...
```

Si se especificó un área (`/scan quality`), limitar la búsqueda a esa área.
