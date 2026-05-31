// ── Usuario autenticado ──────────────────────────────────────────
export interface AuthUser {
  contactId: string;
  name: string;
  email: string;
  initials: string;
}

// ── Sesión guardada en cookie ────────────────────────────────────
export interface SessionData {
  user: AuthUser;
  expiresAt: number;
}

export interface StepProgress {
  [stepId: number]: boolean;
}

export interface ProgressState {
  steps: StepProgress;
  currentStep: number;
  completedCount: number;
}

// ── Segmentos de descripción con links opcionales ──────────────
export interface DescriptionSegment {
  text: string;
  href?: string;
}

// ── Definición de cada paso ──────────────────────────────────────
export interface Step {
  id: number;
  title: string;
  description: string | DescriptionSegment[];
  buttonText?: string;
  iframeUrl: string | null; // null hasta que GHL te pase la URL
}

// ── Estado de cada paso con restricciones ───────────────────────
export interface StepStatus {
  step: number;
  unlocked: boolean; // El usuario puede acceder a este paso
  completed: boolean; // Este paso ya fue completado
  current: boolean; // Este es el paso actual del usuario
}

// ── Respuestas de las API routes ────────────────────────────────
export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  progress?: StepProgress;
  currentStageId?: string; // Stage ID actual en GHL
  error?: string;
}

export interface CompleteStepResponse {
  success: boolean;
  updatedStep?: number;
  error?: string;
}

export interface SyncProgressResponse {
  success: boolean;
  steps?: StepProgress;
  currentStageId?: string; // Stage ID actual en GHL
  opportunityId?: string; // Opportunity ID en GHL
  error?: string;
}

