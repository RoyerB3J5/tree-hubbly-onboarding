import { cookies } from "next/headers"
import { AuthUser, SessionData } from "@/types"

const SESSION_COOKIE = "ghl_portal_session"
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 horas en ms

// ── Crear y guardar sesión ───────────────────────────────────────
export async function createSession(user: AuthUser): Promise<void> {
  const cookieStore = await cookies()

  const session: SessionData = {
    user,
    expiresAt: Date.now() + SESSION_DURATION,
  }

  // Codificamos en base64 (simple, no sensible)
  // En producción podrías usar jose o iron-session para firmarlo
  const encoded = Buffer.from(JSON.stringify(session)).toString("base64")

  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000, // en segundos
    path: "/",
  })
}

// ── Leer sesión actual ───────────────────────────────────────────
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(SESSION_COOKIE)?.value

    if (!raw) return null

    const session: SessionData = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"))

    // Verificar que no expiró
    if (Date.now() > session.expiresAt) {
      await deleteSession()
      return null
    }

    return session
  } catch {
    return null
  }
}

// ── Obtener solo el usuario ──────────────────────────────────────
export async function getSessionUser(): Promise<AuthUser | null> {
  const session = await getSession()
  return session?.user ?? null
}

// ── Eliminar sesión (logout) ─────────────────────────────────────
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
