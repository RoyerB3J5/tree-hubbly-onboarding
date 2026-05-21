import { NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE = "ghl_portal_session"

// Rutas que requieren autenticación
const PROTECTED_ROUTES = ["/dashboard"]

// Rutas que NO debe ver un usuario ya autenticado
const AUTH_ROUTES = ["/login"]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = req.cookies.get(SESSION_COOKIE)?.value

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  // Sin sesión intentando entrar al dashboard → al login
  if (isProtected && !session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión intentando ir al login → al dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
