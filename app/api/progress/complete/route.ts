import { NextRequest, NextResponse } from "next/server"
import { n8nCompleteStep } from "@/lib/n8n"
import { getSessionUser } from "@/lib/session"
import { CompleteStepResponse } from "@/types"

export async function POST(req: NextRequest) {
  try {
    // ── Verificar sesión ─────────────────────────────────────────
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json<CompleteStepResponse>(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    const { stepNumber } = await req.json()

    if (!stepNumber || stepNumber < 1 || stepNumber > 8) {
      return NextResponse.json<CompleteStepResponse>(
        { success: false, error: "Paso inválido" },
        { status: 400 }
      )
    }

    // ── Notificar a n8n para actualizar GHL ──────────────────────
    const result = await n8nCompleteStep({
      contactId: user.contactId,
      stepNumber,
    })

    if (!result.success) {
      return NextResponse.json<CompleteStepResponse>(
        { success: false, error: "Error al actualizar el progreso" },
        { status: 500 }
      )
    }

    return NextResponse.json<CompleteStepResponse>({
      success: true,
      updatedStep: stepNumber,
    })
  } catch (error) {
    console.error("[API /progress/complete]", error)
    return NextResponse.json<CompleteStepResponse>(
      { success: false, error: "Error interno" },
      { status: 500 }
    )
  }
}
