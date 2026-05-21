"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { AuthUser, StepProgress } from "@/types"
import { emptyProgress, markStepComplete, computeProgress } from "@/lib/progress"

interface ClientStore {
  // Estado
  user: AuthUser | null
  steps: StepProgress
  currentStep: number
  completedCount: number

  // Acciones
  setUser: (user: AuthUser) => void
  setProgress: (steps: StepProgress) => void
  completeStep: (stepId: number) => void
  syncSteps: (steps: StepProgress) => void
  logout: () => void
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      // ── Estado inicial ───────────────────────────────────────
      user: null,
      steps: emptyProgress(),
      currentStep: 1,
      completedCount: 0,

      // ── Guardar usuario al hacer login ───────────────────────
      setUser: (user) => set({ user }),

      // ── Cargar progreso desde n8n/GHL ────────────────────────
      setProgress: (steps) => {
        const { currentStep, completedCount } = computeProgress(steps)
        set({ steps, currentStep, completedCount })
      },

      // ── Marcar paso como completado (optimista) ──────────────
      // Se actualiza la UI de inmediato, n8n sincroniza en background
      completeStep: (stepId) =>
        set((state) => {
          const updated = markStepComplete(state.steps, stepId)
          const { currentStep, completedCount } = computeProgress(updated)
          return { steps: updated, currentStep, completedCount }
        }),

      // ── Sincronizar con datos reales de GHL ──────────────────
      syncSteps: (steps) => {
        const { currentStep, completedCount } = computeProgress(steps)
        set({ steps, currentStep, completedCount })
      },

      // ── Limpiar todo al hacer logout ─────────────────────────
      logout: () =>
        set({
          user: null,
          steps: emptyProgress(),
          currentStep: 1,
          completedCount: 0,
        }),
    }),
    {
      name: "ghl-portal-state", // key en localStorage
      // Solo persiste lo necesario, no las funciones
      partialize: (state) => ({
        user: state.user,
        steps: state.steps,
        currentStep: state.currentStep,
        completedCount: state.completedCount,
      }),
    }
  )
)
