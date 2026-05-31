import { NextRequest, NextResponse } from "next/server";
import { getContactByEmail } from "@/lib/ghl-client";
import { createSession } from "@/lib/session";
import { LoginResponse, AuthUser } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, pin } = body;

    // ── Validación básica ────────────────────────────────────────
    if (!email || !pin) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "Email y PIN son requeridos" },
        { status: 400 },
      );
    }

    if (typeof pin !== "string" || pin.length < 4) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "PIN inválido" },
        { status: 400 },
      );
    }

    // ── 1. Buscar contacto por email y obtener datos completos ────
    const contactData = await getContactByEmail(email.toLowerCase().trim());

    if (!contactData.success || !contactData.contactId) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "Email no encontrado" },
        { status: 401 },
      );
    }

    // ── 2. Validar PIN ───────────────────────────────────────────
    if (!contactData.pin) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "PIN no configurado" },
        { status: 401 },
      );
    }

    if (contactData.pin !== pin) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "PIN incorrecto" },
        { status: 401 },
      );
    }

    // ── 3. Crear usuario y sesión ─────────────────────────────────
    const user: AuthUser = {
      contactId: contactData.contactId,
      name: contactData.name || "Usuario",
      email: contactData.email || email,
      initials: (contactData.name || "U")
        .split(" ")
        .map((n: any) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    };

    await createSession(user);

    // ── 4. NOTA: La obtención de oportunidad y progreso se hace ───
    //     en /api/progress/sync después del login (mejor separación)
    return NextResponse.json<LoginResponse>({
      success: true,
      user,
    });
  } catch (error) {
    console.error("[API /auth/login]", error);
    return NextResponse.json<LoginResponse>(
      { success: false, error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
