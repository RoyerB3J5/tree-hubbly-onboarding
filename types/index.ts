// ── Usuario autenticado ──────────────────────────────────────────
export interface AuthUser {
  contactId: string
  name: string
  email: string
  initials: string
}

// ── Sesión guardada en cookie ────────────────────────────────────
export interface SessionData {
  user: AuthUser
  expiresAt: number
}

// ── Estado de progreso del cliente ──────────────────────────────
export type StepStatus = "completed" | "current" | "pending"

export interface StepProgress {
  [stepId: number]: boolean
}

export interface ProgressState {
  steps: StepProgress
  currentStep: number
  completedCount: number
}

// ── Segmentos de descripción con links opcionales ──────────────
export interface DescriptionSegment {
  text: string
  href?: string
}

// ── Definición de cada paso ──────────────────────────────────────
export interface Step {
  id: number
  title: string
  description: string | DescriptionSegment[]
  buttonText?: string
  iframeUrl: string | null // null hasta que GHL te pase la URL
}

// ── Respuestas de las API routes ────────────────────────────────
export interface LoginResponse {
  success: boolean
  user?: AuthUser
  progress?: StepProgress
  error?: string
}

export interface CompleteStepResponse {
  success: boolean
  updatedStep?: number
  error?: string
}

export interface SyncProgressResponse {
  success: boolean
  steps?: StepProgress
  error?: string
}

// ── Payload que envías a n8n ─────────────────────────────────────
export interface N8NLoginPayload {
  email: string
  pin: string
}

export interface N8NCompleteStepPayload {
  contactId: string
  stepNumber: number
}

export interface N8NSyncPayload {
  contactId: string
}

// ── Respuesta que esperas de n8n ─────────────────────────────────
export interface N8NLoginResult {
  success: boolean
  contact?: {
    id: string
    name: string
    email: string
    steps: StepProgress
  }
  error?: string
}
