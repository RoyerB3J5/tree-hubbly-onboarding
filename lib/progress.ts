import { StepProgress, ProgressState } from "@/types"
import { TOTAL_STEPS, getFirstIncompleteStep } from "@/lib/steps"

// ── Calcular estado completo del progreso ────────────────────────
export function computeProgress(steps: StepProgress): ProgressState {
  const completedCount = Object.values(steps).filter(Boolean).length
  const currentStep = getFirstIncompleteStep(steps)

  return {
    steps,
    currentStep,
    completedCount,
  }
}

// ── Calcular porcentaje ──────────────────────────────────────────
export function getProgressPercent(completedCount: number): number {
  return Math.round((completedCount / TOTAL_STEPS) * 100)
}

// ── Estado inicial vacío (0 pasos completados) ───────────────────
export function emptyProgress(): StepProgress {
  const steps: StepProgress = {}
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    steps[i] = false
  }
  return steps
}

// ── Marcar un paso como completado ──────────────────────────────
export function markStepComplete(steps: StepProgress, stepId: number): StepProgress {
  return { ...steps, [stepId]: true }
}

// ── Verificar si todos están completos ───────────────────────────
export function isAllCompleted(steps: StepProgress): boolean {
  return Object.values(steps).every(Boolean)
}
