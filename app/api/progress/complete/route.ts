import { NextRequest, NextResponse } from "next/server";
import { moveToNextStage } from "@/lib/ghl-client";
import { getStageIdForStep } from "@/lib/steps";
import { getSessionUser } from "@/lib/session";
import { CompleteStepResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    // ── Verificar sesión ─────────────────────────────────────────
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<CompleteStepResponse>(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    const { stepNumber, opportunityId } = await req.json();

    if (!stepNumber || stepNumber < 1 || stepNumber > 8) {
      return NextResponse.json<CompleteStepResponse>(
        { success: false, error: "Paso inválido" },
        { status: 400 },
      );
    }

    if (!opportunityId) {
      return NextResponse.json<CompleteStepResponse>(
        { success: false, error: "opportunityId es requerido" },
        { status: 400 },
      );
    }

    // ── Determinar el siguiente stage ────────────────────────────
    // Si completa paso 1, mueve a paso 2, etc.
    const nextStepNumber = Math.min(stepNumber + 1, 8);
    const nextStageId = getStageIdForStep(nextStepNumber);

    if (!nextStageId) {
      return NextResponse.json<CompleteStepResponse>(
        { success: false, error: "Stage inválido" },
        { status: 400 },
      );
    }

    // ── Actualizar GHL: mover a siguiente stage ──────────────────
    const result = await moveToNextStage(opportunityId, nextStageId);

    if (!result.success) {
      return NextResponse.json<CompleteStepResponse>(
        { success: false, error: "Error al actualizar el progreso en GHL" },
        { status: 500 },
      );
    }

    return NextResponse.json<CompleteStepResponse>({
      success: true,
      updatedStep: stepNumber,
    });
  } catch (error) {
    console.error("[API /progress/complete]", error);
    return NextResponse.json<CompleteStepResponse>(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
