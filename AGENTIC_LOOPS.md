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

### 2.2 `subagent_depth`

Controla cuántos **niveles de profundidad** pueden tener los subagentes.

```json
{
  "subagent_depth": 5  // Un subagente puede invocar otro, hasta 5 niveles
}
```

- **Default**: `1` (un subagente NO puede invocar otros subagentes)
- Para loops recursivos necesitás `subagent_depth >= 2`

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

### Tipo 2: Loop por auto-task (recursivo)

Un subagente que se re-invoca a sí mismo al terminar cada ronda:

```json
{
  "subagent_depth": 10,
  "agent": {
    "worker": {
      "description": "Trabajador persistente que se re-invoca",
      "mode": "subagent",
      "permission": {
        "task": "allow"
      },
      "prompt": "Completa UNA parte de la tarea. Cuando termines, evalúa: si queda trabajo pendiente, usa task para invocar 'worker' de nuevo con las instrucciones de lo que falta. Si todo está completo, responde 'OBJETIVO CUMPLIDO'."
    }
  }
}
```

**Cómo usarlo:**
```
@worker Realiza una revisión de todos los archivos sin test coverage
```

**Flujo:** worker → hace un archivo → se re-invoca → hace otro → se re-invoca → ... → termina

**Ventaja:** Control explícito de cada ciclo.
**Desventaja:** Consume más tokens porque cada reinvocación carga el contexto completo.

---

### Tipo 3: Loop por comando personalizado (manual repetitivo)

Un comando que podés ejecutar tantas veces como quieras:

```json
{
  "command": {
    "ronda": {
      "description": "Ejecuta una ronda de mejora y reporta",
      "agent": "worker",
      "subtask": true,
      "template": "Ejecuta UNA ronda de mejora. Al terminar, registra en el archivo de log: 'Ronda completada: (qué se hizo)'. Si queda trabajo pendiente, informa 'PENDIENTE: (qué falta)'."
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

### Tipo 4: Loop orquestado (cadena de agentes)

Un agente primario que coordina subagentes en secuencia:

```
Primario
 ├── @quality → escanea
 ├── @performance → optimiza
 ├── @quality → verifica
 └── decide si repetir
```

Esto se logra con:

```json
{
  "subagent_depth": 5,
  "agent": {
    "orquestador": {
      "description": "Orquesta agentes de mejora en cadena",
      "mode": "all",
      "permission": {
        "task": "allow"
      },
      "prompt": "Eres un orquestador. Para completar la tarea, invoca los agentes necesarios (@quality, @performance, etc.) en secuencia. Después de cada uno, evalúa si el resultado es correcto. Si no, reinvéntalo con instrucciones más específicas. Cuando todo esté listo, responde 'OBJETIVO CUMPLIDO'."
    }
  }
}
```

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
  "subagent_depth": 5,              // ← Para loops recursivos
  "agent": {
    "loop-worker": {
      "mode": "subagent",
      "steps": 10,                  // ← Límite por ronda
      "permission": {
        "task": "allow",            // ← Necesario para auto-reinvocación
        "edit": "allow",
        "bash": "allow"
      },
      "prompt": "Eres un worker persistente. {instrucciones}. Al terminar cada unidad de trabajo, evalúa si hay más trabajo pendiente. Si sí, invócate de nuevo con task. Si no, responde 'COMPLETO'."
    }
  }
}
```

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
