import { NextResponse } from "next/server"
import { n8nSyncProgress } from "@/lib/n8n"
import { getSessionUser } from "@/lib/session"
import { SyncProgressResponse } from "@/types"

export async function GET() {
  try {
    // ── Verificar sesión ─────────────────────────────────────────
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json<SyncProgressResponse>(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    // ── Pedir progreso actualizado a n8n/GHL ─────────────────────
    const result = await n8nSyncProgress({ contactId: user.contactId })

    if (!result.success || !result.steps) {
      // Si n8n no está configurado, no es error crítico
      return NextResponse.json<SyncProgressResponse>({ success: false })
    }

    return NextResponse.json<SyncProgressResponse>({
      success: true,
      steps: result.steps,
    })
  } catch (error) {
    console.error("[API /progress/sync]", error)
    return NextResponse.json<SyncProgressResponse>(
      { success: false, error: "Error interno" },
      { status: 500 }
    )
  }
}
