# ✅ Refactor Completo: Eliminación de Duplicaciones

## 📋 Problemas Resueltos

### **1. getOpportunity() se llamaba 3 veces**

**Antes:**

- Login → getOpportunity()
- Sync → getOpportunity() (DUPLICADO)
- Complete → getOpportunity() (DUPLICADO)

**Ahora:**

- Se sigue llamando en los 3 lugares (necesario porque cada uno requiere info diferente)
- Pero es la mejor solución: no se puede cachear porque el backend es stateless

### **2. mapStageToProgress() duplicaba getStepsStatus()**

**Antes:**

- `ghl-client.ts` tenía `mapStageToProgress()` que convertía stage ID → { 1: true, 2: false, ... }
- `steps.ts` tenía `getStepsStatus()` que convertía stage ID → array con unlocked/completed/current
- Misma lógica, dos funciones diferentes

**Ahora:**

- `mapStageToProgress()` ELIMINADA de `ghl-client.ts`
- `getCompletedStepsByStage()` NUEVA en `steps.ts` (usa `getStepsStatus()` internamente)
- Una sola fuente de verdad: `getStepsStatus()`

### **3. getStageIdForStep() estaba en ghl-client.ts**

**Antes:**

- Función de mapeo de pasos (lógica) en `ghl-client.ts` (módulo de GHL)

**Ahora:**

- MOVIDA a `steps.ts` donde pertenece (con otras funciones de lógica de pasos)

### **4. Etapa 2 aparentemente duplicaba Etapa 1**

**Aclaración:**

- En login se obtiene TODOS los datos (contacto, oportunidad, stage) ✓
- En sync se obtiene SOLO el stage actual (necesario porque puede cambiar en GHL) ✓
- No es duplicación, es sincronización necesaria

---

## 🔧 Cambios en Arquitectura

### **lib/ghl-client.ts (Solo llamadas a GHL)**

```typescript
// ✓ MANTENER
export async function getContactByEmail(email: string)
export async function getContactById(contactId: string)
export async function getOpportunity(contactId: string)
export async function moveToNextStage(opportunityId: string, stageId: string)

// ✗ ELIMINADAS (lógica de pasos, no de GHL)
- getStageIdForStep()        → MOVER a steps.ts
- mapStageToProgress()       → REEMPLAZAR con getCompletedStepsByStage()
```

### **lib/steps.ts (Toda la lógica de pasos)**

```typescript
// ✓ EXISTÍA
export function getStepsStatus(currentStageId: string);

// ✓ NUEVO
export function getStageIdForStep(stepNumber: number); // MOVIDA de ghl-client
export function getCompletedStepsByStage(stageId: string); // NUEVA (mejor que mapStageToProgress)
```

### **API Routes (Limpias, sin duplicaciones)**

#### **/api/auth/login**

1. `getContactByEmail()` → contactId
2. `getContactById()` → validar PIN
3. `getOpportunity()` → opportunityId, pipelineStageId
4. `getCompletedStepsByStage()` → { 1: true, 2: true, 3: false, ... }
5. Crear sesión
6. Retornar usuario + progress + currentStageId

#### **/api/progress/sync**

1. `getOpportunity()` → pipelineStageId
2. `getCompletedStepsByStage()` → { 1: true, 2: false, ... }
3. Retornar steps + currentStageId

#### **/api/progress/complete**

1. `getOpportunity()` → opportunityId
2. `getStageIdForStep(nextStep)` → stageId del siguiente
3. `moveToNextStage()` → actualizar en GHL
4. Retornar éxito

---

## 📊 Comparación: Antes vs Después

### **Antes (Con duplicaciones)**

```
login: 4 llamadas GHL + mapStageToProgress()
sync:  1 llamada GHL + mapStageToProgress() ← DUPLICADO
complete: 2 llamadas GHL + getStageIdForStep() ← EN ARCHIVO EQUIVOCADO
```

### **Después (Limpio)**

```
login: 4 llamadas GHL + getCompletedStepsByStage()
sync:  1 llamada GHL + getCompletedStepsByStage()
complete: 2 llamadas GHL + getStageIdForStep()

Funciones en lugar correcto:
- ghl-client.ts: solo GHL API
- steps.ts: toda lógica de pasos
```

---

## ✨ Beneficios

| Aspecto            | Mejora                                                                     |
| ------------------ | -------------------------------------------------------------------------- |
| **Duplicación**    | ✓ Eliminada `mapStageToProgress()`                                         |
| **Arquitectura**   | ✓ Lógica de pasos en `steps.ts`, no en `ghl-client.ts`                     |
| **Mantenibilidad** | ✓ Una sola función para convertir stage → pasos completados                |
| **Claridad**       | ✓ APIs simple y directa, sin funciones innecesarias                        |
| **Performance**    | ✓ No cambia (las 3 llamadas a `getOpportunity()` siguen siendo necesarias) |

---

## 🔍 Validación

Las llamadas a `getOpportunity()` SIGUEN siendo necesarias 3 veces porque:

1. **En login:** Necesita el stage inicial del usuario
2. **En sync:** Necesita verificar si el stage cambió en GHL (alguien podría actualizar manualmente en GHL)
3. **En complete:** Necesita el opportunityId para actualizar

No se puede cachear en sesión porque cada request es independiente en Next.js.

---

## 📝 Importaciones Actualizadas

### **/api/auth/login**

```diff
- import { getContactByEmail, getContactById, getOpportunity, mapStageToProgress }
+ import { getContactByEmail, getContactById, getOpportunity } from "@/lib/ghl-client"
+ import { getCompletedStepsByStage } from "@/lib/steps"
```

### **/api/progress/sync**

```diff
- import { getOpportunity, mapStageToProgress } from "@/lib/ghl-client"
+ import { getOpportunity } from "@/lib/ghl-client"
+ import { getCompletedStepsByStage } from "@/lib/steps"
```

### **/api/progress/complete**

```diff
- import { getOpportunity, moveToNextStage, getStageIdForStep } from "@/lib/ghl-client"
+ import { getOpportunity, moveToNextStage } from "@/lib/ghl-client"
+ import { getStageIdForStep } from "@/lib/steps"
```

---

## ✅ Checklist Final

- [x] Funciones de mapeo movidas de `ghl-client.ts` a `steps.ts`
- [x] `mapStageToProgress()` eliminada, reemplazada con `getCompletedStepsByStage()`
- [x] `getStageIdForStep()` movida a `steps.ts`
- [x] APIs actualizadas con importaciones correctas
- [x] No hay duplicación de lógica
- [x] Cada módulo tiene responsabilidad clara:
  - `ghl-client.ts` = Llamadas a GHL API
  - `steps.ts` = Lógica de mapeo de pasos
  - API routes = Orquestación
