# 🎯 Sistema de Pasos: Integración Directa con API de Go High Level

## ⚠️ IMPORTANTE: SIN n8n - TODO va directo por la API de GHL

Este documento describe cómo funciona el sistema de restricciones de pasos usando directamente la API de Go High Level, sin intermediarios como n8n.

---

## 🔄 El Flujo Completo

### **Etapa 1: Login → Obtener datos de GHL**

```
Usuario: email + PIN
    ↓
/api/auth/login (POST)
    ↓
getContactByEmail(email)
    ├─ Busca contacto en GHL por email
    └─ Retorna: contactId
    ↓
getContactById(contactId)
    ├─ Obtiene datos del contacto: name, email, PIN (custom field)
    ├─ Valida que PIN coincida
    └─ Retorna: name, email
    ↓
getOpportunity(contactId)
    ├─ Obtiene oportunidad del contacto
    └─ Retorna: opportunityId, pipelineStageId
    ↓
mapStageToProgress(pipelineStageId)
    ├─ Mapea stage actual a pasos completados
    └─ Retorna: { completedSteps: {1: true, 2: true, 3: false, ...}, stepNumber }
    ↓
Response: {
  success: true,
  user: { contactId, name, email, initials },
  progress: { 1: true, 2: true, 3: false, ... },
  currentStageId: "b6e16e47-90d5-4429-9463-bde4233d11f6"
}
```

---

### **Etapa 2: Dashboard → Sincronizar con GHL**

```
Dashboard carga
    ↓
useEffect: syncFromGHL()
    ↓
/api/progress/sync (GET)
    ↓
getOpportunity(user.contactId)
    └─ Obtiene pipelineStageId actual
    ↓
mapStageToProgress(pipelineStageId)
    └─ Calcula pasos completados
    ↓
getStepsStatus(currentStageId)
    └─ Determina: unlocked, completed, current para cada paso
    ↓
Response: {
  success: true,
  steps: { 1: true, 2: true, 3: false, ... },
  currentStageId: "b6e16e47-90d5-4429-9463-bde4233d11f6"
}
    ↓
UI renderiza:
- Pasos desbloqueados: botones activos
- Pasos bloqueados: botones deshabilitados 🔒
```

---

### **Etapa 3: Completar un Paso**

```
Usuario en /dashboard/step/3
    ↓
Completa formulario en iframe de GHL
    ↓
iframe emite: form_submitted o appointment_booked
    ↓
handleComplete() activa
    ↓
POST /api/progress/complete { stepNumber: 3 }
    ↓
getOpportunity(user.contactId)
    └─ Obtiene: opportunityId, pipelineStageId
    ↓
getStageIdForStep(3 + 1)
    └─ Obtiene stageId para paso 4
    ↓
moveToNextStage(opportunityId, stageId)
    └─ Actualiza en GHL: mueve oportunidad a paso 4
    ↓
Response: { success: true, updatedStep: 3 }
    ↓
Store actualiza: completeStep(3)
UI muestra: "✓ Paso completado"
Redirige: /dashboard/step/4
```

---

## 🔧 Funciones Principales en `ghl-client.ts`

### **1. getContactByEmail(email: string)**

```typescript
// Busca un contacto por email en GHL
const { contactId } = await getContactByEmail("usuario@example.com");
// Retorna: { contactId: "CONTACT_ID_123" }
```

### **2. getContactById(contactId: string)**

```typescript
// Obtiene datos completos del contacto
const { name, email, pin, success } = await getContactById(contactId);
// Retorna:
// {
//   success: true,
//   contactId: "...",
//   name: "Juan Pérez",
//   email: "juan@example.com",
//   pin: "1234"  ← Del custom field 'contact.th__pin'
// }
```

### **3. getOpportunity(contactId: string)**

```typescript
// Obtiene la oportunidad actual del contacto
const { opportunityId, pipelineStageId } = await getOpportunity(contactId);
// Retorna:
// {
//   opportunityId: "OPP_123",
//   pipelineStageId: "b6e16e47-90d5-4429-9463-bde4233d11f6"  ← UUID del stage
// }
```

### **4. moveToNextStage(opportunityId: string, stageId: string)**

```typescript
// Mueve una oportunidad a un stage específico
const result = await moveToNextStage(
  "OPP_123",
  "b69e877a-9074-46ea-8421-8d50ff0e5d17",
);
// Retorna:
// {
//   success: true,
//   opportunityId: "OPP_123",
//   currentStageId: "b69e877a-9074-46ea-8421-8d50ff0e5d17"
// }
```

### **5. getStageIdForStep(stepNumber: number)**

```typescript
// Convierte número de paso (1-8) a stage ID de GHL
const stageId = getStageIdForStep(3);
// Retorna: "b6e16e47-90d5-4429-9463-bde4233d11f6"

// Mapeo:
// 1 → paso1: "ca1f87fc-d71b-49bf-9429-146da48849bc"
// 2 → paso2: "caedfb77-1d3c-4a73-aab7-90cfed8b4a4a"
// 3 → paso3: "b6e16e47-90d5-4429-9463-bde4233d11f6"
// ...
// 8 → paso8: "8271ecb5-df0f-452d-b3bb-567ad09f5ea8"
```

### **6. mapStageToProgress(stageId: string)**

```typescript
// Mapea un stage ID a información de progreso
const { completedSteps, stepNumber } = mapStageToProgress(stageId);

// Ejemplo si stageId = paso3:
// completedSteps = {
//   1: true,  ✓
//   2: true,  ✓
//   3: false, 🟡 actual
//   4: false, 🔒
//   5: false, 🔒
//   ...
// }
// stepNumber = 3
```

---

## 📍 Rutas API

### **POST /api/auth/login**

Login del usuario.

```typescript
// Request
{
  email: "usuario@example.com",
  pin: "1234"
}

// Response
{
  success: true,
  user: {
    contactId: "CONTACT_123",
    name: "Juan Pérez",
    email: "juan@example.com",
    initials: "JP"
  },
  progress: { 1: true, 2: true, 3: false, ... },
  currentStageId: "b6e16e47-90d5-4429-9463-bde4233d11f6"
}
```

Lógica:

1. `getContactByEmail()` → obtiene contactId
2. `getContactById()` → valida PIN
3. `getOpportunity()` → obtiene stage actual
4. `mapStageToProgress()` → calcula pasos completados
5. Crear sesión

---

### **GET /api/progress/sync**

Sincroniza progreso actual desde GHL.

```typescript
// Response
{
  success: true,
  steps: { 1: true, 2: true, 3: false, ... },
  currentStageId: "b6e16e47-90d5-4429-9463-bde4233d11f6"
}
```

Lógica:

1. `getOpportunity()` → obtiene stage actual
2. `mapStageToProgress()` → calcula pasos completados
3. Retornar resultado

---

### **POST /api/progress/complete**

Marca un paso como completado y avanza al siguiente.

```typescript
// Request
{
  stepNumber: 3
}

// Response
{
  success: true,
  updatedStep: 3
}
```

Lógica:

1. `getOpportunity()` → obtiene opportunityId
2. `getStageIdForStep(stepNumber + 1)` → calcula siguiente stage
3. `moveToNextStage()` → actualiza en GHL
4. Retornar éxito

---

## 📊 Mapeo: Stage ID ↔ Paso

```typescript
// ghl-config.ts
const GHL_CONFIG = {
  pipeline: {
    id: "GXstsnDHp5ee2X4wwPuM",
    stages: {
      paso1: "ca1f87fc-d71b-49bf-9429-146da48849bc",
      paso2: "caedfb77-1d3c-4a73-aab7-90cfed8b4a4a",
      paso3: "b6e16e47-90d5-4429-9463-bde4233d11f6",
      paso4: "b69e877a-9074-46ea-8421-8d50ff0e5d17",
      paso5: "61494483-4721-49ba-aaa8-81514f009e30",
      paso6: "3c9a8844-d2c5-4ecb-84d8-3260e921e36d",
      paso7: "066b8d7a-c64f-4830-a42a-655d4d757ea6",
      paso8: "8271ecb5-df0f-452d-b3bb-567ad09f5ea8",
      completo: "911221ee-1b1a-4ba5-95a1-37b810479378",
    },
  },
  customFields: {
    pin: "contact.th__pin", // Donde se almacena el PIN
  },
};
```

---

## 🔒 Variables de Entorno Requeridas

```bash
# .env.local
GHL_LOCATION_ID=your_location_id
GHL_API_TOKEN=your_api_token
```

---

## 🎨 Estados Visuales en Dashboard

```
┌────────────────────────────────────┐
│ PASO COMPLETADO (1-2)              │
├────────────────────────────────────┤
│ Step 01              ✓ check       │
│ Programa Llamada Setup             │
│ Descripción...                     │
│ [Agendar llamada] (disabled)       │
│ Border: secondary                  │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ PASO ACTUAL (3)                    │
├────────────────────────────────────┤
│ Step 03              🟡 círculo    │
│ Programa Llamada Kickoff           │
│ Descripción...                     │
│ [Agendar llamada] (clickeable)     │
│ Border: secondary                  │
│ Background: #152232                │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ PASO BLOQUEADO (4-8)               │
├────────────────────────────────────┤
│ Step 04              🔒 lock       │
│ Información del Negocio            │
│ Descripción...                     │
│ [🔒 Bloqueado] (disabled)          │
│ Border: gray                       │
│ Background: #0a0f14                │
│ Opacity: 60%                       │
└────────────────────────────────────┘
```

---

## ✅ Checklist de Integración

- [x] `ghl-client.ts` con todas las funciones
- [x] `/api/auth/login` usando GHL directamente
- [x] `/api/progress/sync` usando GHL directamente
- [x] `/api/progress/complete` usando GHL directamente
- [x] Mapeo de stage ID a pasos completados
- [x] Restricciones visuales en DashboardClient
- [x] Protección de acceso en StepClient
- [x] Store actualizado con currentStageId
- [ ] URLs reales de iframes de GHL (en steps.ts)
- [ ] Validación en backend de permisos de pasos

---

## 🚀 Cómo Funciona en Desarrollo

**Mock data en `ghl-client.ts`:**

- PIN: "1234" (con cualquier email)
- Usuario simulado está en paso 3
- Pasos 1-2 completados ✓
- Paso 3 actual (desbloqueado)
- Pasos 4-8 bloqueados 🔒

**Para usar datos reales:**

1. Configurar `GHL_LOCATION_ID` y `GHL_API_TOKEN` en `.env.local`
2. Las funciones harán llamadas reales a la API de GHL
3. Todo funciona sin cambiar el código

---

## 🔐 Consideraciones de Seguridad

✅ **Frontend:**

- Bloquea botones visualmente
- Previene navegación si no está desbloqueado
- Redirige si intenta acceder directamente a pasos bloqueados

✅ **Backend (en API routes):**

- Valida sesión del usuario
- Obtiene stage actual desde GHL (no confía en cliente)
- Solo permite completar pasos según stage actual en GHL

✅ **GHL:**

- PIN almacenado en custom field (encriptado por GHL)
- Oportunidades solo visibles para location autenticada
- API token en variable de entorno (nunca expuesto al cliente)

---

## 📝 Notas Importantes

1. **El PIN se valida en backend:** El API de GHL devuelve el PIN en el custom field. Nunca se envía al frontend.

2. **Stage actual es la fuente de verdad:** Siempre se obtiene de GHL, nunca se confía en datos del cliente.

3. **Mapeo manual de pasos:** Como cada cliente de GHL tiene stages diferentes, el mapeo se hace en `mapStageToProgress()` que convierte stage ID a pasos completados.

4. **URLs de iframes:** Los iframes de GHL se configuran en `/lib/steps.ts` en el array `STEPS`. Actualmente son `null` hasta que GHL proporcione las URLs.
