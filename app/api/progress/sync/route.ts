import { NextResponse } from "next/server";
import { getOpportunity } from "@/lib/ghl-client";
import { getCompletedStepsByStage } from "@/lib/steps";
import { getSessionUser } from "@/lib/session";
import { SyncProgressResponse } from "@/types";

export async function GET() {
  try {
    // ── Verificar sesión ─────────────────────────────────────────
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<SyncProgressResponse>(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    // ── Obtener oportunidad actual de GHL ────────────────────────
    const opportunity = await getOpportunity(user.contactId);

    if (!opportunity.opportunityId || !opportunity.pipelineStageId) {
      return NextResponse.json<SyncProgressResponse>(
        { success: false, error: "No se pudo obtener el progreso" },
        { status: 400 },
      );
    }

    // ── Obtener pasos completados desde el stage ──────────────────
    const completedSteps = getCompletedStepsByStage(
      opportunity.pipelineStageId,
    );

    return NextResponse.json<SyncProgressResponse>({
      success: true,
      steps: completedSteps,
      currentStageId: opportunity.pipelineStageId,
      opportunityId: opportunity.opportunityId,
    });
  } catch (error) {
    console.error("[API /progress/sync]", error);
    return NextResponse.json<SyncProgressResponse>(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
