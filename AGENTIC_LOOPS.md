# Guía de Agentes con Loop en opencode

> Archivo de referencia para entender y dominar loops agénticos.
> Creado: 2026-07-21

---

## 1. ¿Qué es un "loop agéntico"?

Un loop agéntico es cuando un agente de IA **se re-invoca a sí mismo** (o es invocado repetidamente) para completar una tarea grande que no puede resolverse en una sola conversación.

En lugar de:
```
Humano: "Haz todo esto"
AI: [intenta hacer todo, se queda sin contexto, responde incompleto]
```

El loop hace:
```
Humano: "Haz esto"
AI: [hace una parte, se re-invoca]
AI: [hace otra parte, se re-invoca]
... hasta que se cumple el objetivo
```

---

## 2. Conceptos Clave en opencode

### 2.1 `steps` (antes `maxSteps`)

Controla **cuántas iteraciones** puede hacer un agente antes de forzar una respuesta de texto.

```json
// En opencode.json
{
  "agent": {
    "mi-agente": {
      "steps": 10   // Máximo 10 iteraciones
    }
  }
}
```

- **No definirlo** = sin límite (loop infinito hasta que el modelo decide parar)
- **Valor bajo** (3-5) = agente rápido y barato
- **Valor alto** (20+) = agente persistente para tareas complejas

### 2.2 `subagent_depth` (no disponible en esta versión)

En versiones recientes de opencode este campo fue eliminado.

**Implicación:** los subagentes NO pueden invocar a otros subagentes. Solo el agente primario (build) puede usar `task` para invocar subagentes.

Para loops: el loop debe ejecutarlo el agente **build** (primario), no un subagente.

### 2.3 `task` tool

Es la herramienta que permite que un agente invoque a otro agente.

```
@quality Haz una revisión del archivo src/lib/api.ts
```

Cuando un agente usa `task`, crea una **sesión hija** que corre independientemente y devuelve resultados al padre.

### 2.4 Modos de agente

| Modo | ¿Puede invocar task? | ¿Puede recibir task? |
|------|---------------------|---------------------|
| `primary` | ✅ Sí | ❌ No |
| `subagent` | ❌ No (sin task permission) | ✅ Sí |
| `all` | ✅ Sí | ✅ Sí |

Para loops: el agente que hace el loop debe tener `mode: "primary"` o `mode: "all"` con `permission.task.allow`.

---

## 3. Los 4 Tipos de Loop

### Tipo 1: Loop por `steps` (el más simple)

El agente itera automáticamente sin límite:

```json
{
  "agent": {
    "persistente": {
      "description": "Trabaja hasta terminar",
      "mode": "primary",
      // steps NO definido = infinito
      "prompt": "Sigue trabajando hasta que la tarea esté 100% completa. No te detengas antes."
    }
  }
}
```

**Cómo usarlo:** Solo hablás con el agente y él sigue iterando.

**Ventaja:** No requiere configuración compleja.
**Desventaja:** El modelo puede decidir detenerse antes de tiempo.

---

### Tipo 2: Loop por comando personalizado (manual repetitivo)

El agente BUILD te invoca a TI (el humano) entre rondas.

Un comando que podés ejecutar tantas veces como quieras:

```json
{
  "command": {
    "ronda": {
      "description": "Ejecuta una ronda de mejora y reporta",
      "agent": "quality",
      "template": "Ejecuta UNA ronda de mejora de calidad. Al terminar, registra en .opencode/improve/rounds.md lo que hiciste. Informa 'PENDIENTE: (qué falta)' si queda trabajo."
    }
  }
}
```

**Cómo usarlo:**
```
/ronda
# ... revisás el resultado ...
/ronda
# ... otra vez ...
```

**Ventaja:** Control humano en cada ciclo. No hay loops infinitos inesperados.
**Desventaja:** Requiere intervención manual.

---

### Tipo 3: Loop orquestado (cadena de agentes, el de AgendaYa)

El agente primario (`build`) coordina subagentes en secuencia:

```
Build (primario)
 ├── task → @quality   → hace 1 ronda
 ├── task → @architecture → hace 1 ronda
 ├── task → @reliability → hace 1 ronda
 └── ...
```

Los comandos `/campaign` y `/improve` de AgendaYa usan este patrón. El primario tiene `permission.task: allow` para poder invocar a cada subagente.

**Ventaja:** No necesita `subagent_depth`. El primario invoca subagentes, los subagentes solo trabajan.
**Desventaja:** El primario acumula contexto de todas las divisiones.

---



---

## 4. Peligros y Cómo Mitigarlos

| Peligro | Qué pasa | Cómo evitarlo |
|---------|----------|---------------|
| **Loop infinito real** | El agente se re-invoca sin parar y quema crédito de API | Siempre tener un **criterio de salida** explícito en el prompt: "Si en 3 rondas no encuentras nada nuevo, detente" |
| **Costo inesperado** | Una sesión intensiva puede gastar $5-10 | Usar modelo barato para tareas simples, monitorear con `/status` |
| **Contexto saturado** | Cada reinvocación acumula contexto, eventuamente se llena | Usar `/compact` o habilitar compaction automático |
| **Cambios conflictivos** | Dos rondas modifica el mismo archivo de formas incompatibles | Hacer `git commit` antes de cada ronda; si algo sale mal, `git revert` |
| **Loop sin progreso** | El agente da vueltas sobre lo mismo sin avanzar | En el prompt: "Si no puedes hacer progreso real en esta ronda, responde 'BLOQUEADO: (razón)'" |

---

## 5. Patrón Recomendado para AgendaYa

El sistema que creamos para AgendaYa usa el **Tipo 3 + Tipo 4 combinados**:

```
/ronda quality                  # Ejecuta 1 ronda de calidad
  → @quality (subagent)
    → hace 1-5 cambios
    → actualiza rounds.md
    → termina

# Revisás el resultado, commiteás si está bien

/ronda performance              # Ejecuta 1 ronda de performance
  → @performance (subagent)
    → hace 1-5 cambios
    → actualiza rounds.md
    → termina
```

**Ventaja de este patrón:** Tenés control humano entre rondas, evitando sorpresas, mientras que cada ronda individual es autónoma.

---

## 6. Práctica Paso a Paso

### Beginner

1. Creá un agente simple sin `steps` y observá cómo itera naturalmente
2. Usá `/improve quality: Escanea el códigobase buscando imports sin usar`
3. Revisá el resultado con `/report`

### Intermediate

4. Creá tu primer loop recursivo: un subagent que se re-invoca
5. Probá con `subagent_depth: 2` y aumentá gradualmente
6. Monitoreá el costo y el tiempo de cada ronda

### Advanced

7. Implementá un orquestador que coordine 2-3 subagentes
8. Agregá criterios de salida complejos (tiempo, cantidad de cambios, cobertura)
9. Configurá un pipeline CI/CD que ejecute rondas automáticas semanales

---

## 7. Comandos Rápidos

```bash
# Ver configuración actual del agente
cat .opencode/agents/quality.md

# Ver agentes disponibles
ls .opencode/agents/

# Ejecutar un comando personalizado
/improve quality: Describe aquí qué quieres mejorar

# Ver el historial de rondas
/report

# Compactar la sesión actual (libera contexto)
/compact

# Crear un nuevo agente interactivamente
opencode agent create

# Ver estado del proyecto
/status
```

---

## 8. Referencia Rápida de Configuración

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "build": {
      "permission": {
        "task": "allow"
      }
    },
    "worker": {
      "mode": "subagent",
      "permission": {
        "edit": "allow",
        "bash": "allow"
      },
      "prompt": "Eres un worker. Completa la tarea asignada y reporta."
    }
  }
}
```

### Campos clave

| Campo | Ubicación | Obligatorio | Propósito |
|-------|-----------|-------------|-----------|
| `permission.task: "allow"` | En el agente primario | ✅ Para loops | Permite que BUILD invoque subagentes |
| `steps` | Por agente | ❌ | Límite de iteraciones por ronda (omitir = sin límite) |

### Dónde va el archivo

El config debe estar en `.opencode/opencode.json` (relativo al proyecto).

Las referencias `{file:agents/calidad.md}` son **relativas al directorio del config** (`.opencode/`), no a la raíz del proyecto.

---

## 9. Glosario

| Término | Significado |
|---------|-------------|
| **steps** | Número máximo de iteraciones de un agente antes de responder texto |
| **subagent_depth** | Cuántos niveles de profundidad pueden tener los subagentes |
| **task tool** | Herramienta que permite a un agente invocar a otro |
| **Sesión hija** | Conversación separada creada por `task`, con su propio contexto |
| **Compaction** | Proceso de resumir contexto para liberar tokens |
| **Loop agéntico** | Patrón donde un agente se re-invoca para completar tareas grandes |
| **Criterio de salida** | Condición explícita que detiene el loop (ej: "cuando no haya más errores") |
