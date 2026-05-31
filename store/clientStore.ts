"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser, StepProgress } from "@/types";
import {
  emptyProgress,
  markStepComplete,
  computeProgress,
} from "@/lib/progress";

interface ClientStore {
  // Estado
  user: AuthUser | null;
  steps: StepProgress;
  currentStep: number;
  completedCount: number;
  currentStageId: string | null; // UUID del stage actual en GHL
  opportunityId: string | null; // ID de la oportunidad en GHL

  // Acciones
  setUser: (user: AuthUser) => void;
  setProgress: (steps: StepProgress, stageId?: string, opportunityId?: string) => void;
  completeStep: (stepId: number) => void;
  syncSteps: (steps: StepProgress, stageId?: string, opportunityId?: string) => void;
  setCurrentStageId: (stageId: string) => void;
  setOpportunityId: (opportunityId: string) => void;
  logout: () => void;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      // ── Estado inicial ───────────────────────────────────────
      user: null,
      steps: emptyProgress(),
      currentStep: 1,
      completedCount: 0,
      currentStageId: null,
      opportunityId: null,

      // ── Guardar usuario al hacer login ───────────────────────
      setUser: (user) => set({ user }),

      // ── Cargar progreso desde GHL ───────────────────────────────
      setProgress: (steps, stageId, opportunityId) => {
        const { currentStep, completedCount } = computeProgress(steps);
        set({
          steps,
          currentStep,
          completedCount,
          currentStageId: stageId || null,
          opportunityId: opportunityId || null,
        });
      },

      // ── Marcar paso como completado (optimista) ──────────────
      // Se actualiza la UI de inmediato, API sincroniza en background
      completeStep: (stepId) =>
        set((state) => {
          const updated = markStepComplete(state.steps, stepId);
          const { currentStep, completedCount } = computeProgress(updated);
          return { steps: updated, currentStep, completedCount };
        }),

      // ── Sincronizar con datos reales de GHL ──────────────────
      syncSteps: (steps, stageId, opportunityId) => {
        const { currentStep, completedCount } = computeProgress(steps);
        set({
          steps,
          currentStep,
          completedCount,
          currentStageId: stageId || null,
          opportunityId: opportunityId || null,
        });
      },

      // ── Guardar el stage actual de GHL ───────────────────────
      setCurrentStageId: (stageId) => set({ currentStageId: stageId }),

      // ── Guardar el opportunity ID de GHL ─────────────────────
      setOpportunityId: (opportunityId) => set({ opportunityId }),

      // ── Limpiar todo al hacer logout ─────────────────────────
      logout: () =>
        set({
          user: null,
          steps: emptyProgress(),
          currentStep: 1,
          completedCount: 0,
          currentStageId: null,
          opportunityId: null,
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
        currentStageId: state.currentStageId,
        opportunityId: state.opportunityId,
      }),
    },
  ),
);
