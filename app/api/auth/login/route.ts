import { NextRequest, NextResponse } from "next/server"
import { n8nLogin } from "@/lib/n8n"
import { createSession } from "@/lib/session"
import { LoginResponse, AuthUser } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, pin } = body

    // ── Validación básica ────────────────────────────────────────
    if (!email || !pin) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "Email y PIN son requeridos" },
        { status: 400 }
      )
    }

    if (typeof pin !== "string" || pin.length < 4) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "PIN inválido" },
        { status: 400 }
      )
    }

    // ── Llamar a n8n ─────────────────────────────────────────────
    const result = await n8nLogin({ email: email.toLowerCase().trim(), pin })

    if (!result.success || !result.contact) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: result.error ?? "Credenciales incorrectas" },
        { status: 401 }
      )
    }

    // ── Crear sesión ─────────────────────────────────────────────
    const user: AuthUser = {
      contactId: result.contact.id,
      name: result.contact.name,
      email: result.contact.email,
      initials: result.contact.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    }

    await createSession(user)

    return NextResponse.json<LoginResponse>({
      success: true,
      user,
      progress: result.contact.steps,
    })
  } catch (error) {
    console.error("[API /auth/login]", error)
    return NextResponse.json<LoginResponse>(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
