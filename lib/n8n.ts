import {
  N8NLoginPayload,
  N8NLoginResult,
  N8NCompleteStepPayload,
  N8NSyncPayload,
  StepProgress,
} from "@/types"

// ────────────────────────────────────────────────────────────────
// Todas las llamadas a n8n están aquí centralizadas.
// Cuando tengas las URLs reales en .env.local, todo funciona solo.
// ────────────────────────────────────────────────────────────────

const WEBHOOK_LOGIN = process.env.N8N_WEBHOOK_LOGIN!
const WEBHOOK_COMPLETE = process.env.N8N_WEBHOOK_COMPLETE_STEP!
const WEBHOOK_SYNC = process.env.N8N_WEBHOOK_SYNC_PROGRESS!

// ── Helper para llamadas HTTP ────────────────────────────────────
async function callWebhook<T>(url: string, payload: unknown): Promise<T> {
  if (!url || url.startsWith("https://TU-N8N")) {
    throw new Error("WEBHOOK_NOT_CONFIGURED")
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // Timeout de 10 segundos para no colgar la UI
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    throw new Error(`Webhook error: ${res.status}`)
  }

  return res.json() as T
}

// ── Login: verifica email + PIN contra GHL via n8n ───────────────
export async function n8nLogin(payload: N8NLoginPayload): Promise<N8NLoginResult> {
  try {
    return await callWebhook<N8NLoginResult>(WEBHOOK_LOGIN, payload)
  } catch (error) {
    // Si el webhook no está configurado todavía, usamos mock
    if (error instanceof Error && error.message === "WEBHOOK_NOT_CONFIGURED") {
      return getMockLoginResult(payload)
    }
    throw error
  }
}

// ── Marcar paso como completado en GHL via n8n ───────────────────
export async function n8nCompleteStep(
  payload: N8NCompleteStepPayload
): Promise<{ success: boolean }> {
  try {
    return await callWebhook<{ success: boolean }>(WEBHOOK_COMPLETE, payload)
  } catch (error) {
    if (error instanceof Error && error.message === "WEBHOOK_NOT_CONFIGURED") {
      // Mock: simula éxito cuando n8n no está configurado
      console.warn("[n8n] Webhook no configurado, simulando éxito para paso:", payload.stepNumber)
      return { success: true }
    }
    throw error
  }
}

// ── Sincronizar progreso real desde GHL via n8n ──────────────────
export async function n8nSyncProgress(
  payload: N8NSyncPayload
): Promise<{ success: boolean; steps?: StepProgress }> {
  try {
    return await callWebhook<{ success: boolean; steps?: StepProgress }>(WEBHOOK_SYNC, payload)
  } catch (error) {
    if (error instanceof Error && error.message === "WEBHOOK_NOT_CONFIGURED") {
      console.warn("[n8n] Webhook no configurado, skip sync")
      return { success: false }
    }
    throw error
  }
}

// ── Mock para desarrollo sin n8n ─────────────────────────────────
// Simula la respuesta que daría n8n cuando esté configurado.
// Usa: email cualquiera + PIN "1234"
function getMockLoginResult(payload: N8NLoginPayload): N8NLoginResult {
  if (payload.pin !== "1234") {
    return { success: false, error: "PIN incorrecto" }
  }

  const name = payload.email.split("@")[0]
  const initials = name.slice(0, 2).toUpperCase()

  return {
    success: true,
    contact: {
      id: "MOCK_CONTACT_001",
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: payload.email,
      steps: {
        1: true,
        2: true,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
      },
    },
  }
}
