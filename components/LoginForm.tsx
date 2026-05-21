"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useClientStore } from "@/store/clientStore"

export default function LoginForm() {
  const router = useRouter()
  const { setUser, setProgress } = useClientStore()

  const [email, setEmail] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? "Credenciales incorrectas")
        return
      }

      setUser(data.user)
      if (data.progress) {
        setProgress(data.progress)
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }


  return (
    // ── AQUÍ VA TU UI DEL FIGMA ──────────────────────────────────
    // El componente tiene toda la lógica lista.
    // Solo reemplaza el JSX de abajo con tu diseño del Figma.
    // Las variables que tienes disponibles son:
    //   email, setEmail, pin, setPin → para los inputs
    //   error → string con mensaje de error (vacío si no hay error)
    //   loading → boolean para mostrar spinner/deshabilitar botón
    //   handleSubmit → función para el onSubmit del form
    // ────────────────────────────────────────────────────────────

    <div className="w-full min-h-screen flex justify-center items-center overflow-y-hidden">
      <div className="container-full flex flex-col gap-6 3xl:gap-8 justify-center items-center py-10 ">
        {process.env.NODE_ENV === "development" && (
          <p className="text-center text-xs text-gray-400 mt-4 hidden">
            Demo: cualquier email + PIN <code className="font-mono">1234</code>
          </p>
        )}
        <a href="#">
          <Image src="/logo.svg" alt="Logo Treehubly" width={168} height={30} style={{ width: 'auto', height: 'auto' }} />
        </a>
        <div className="w-full md:w-auto bg-[#f7f7f7] flex flex-col justify-center items-center gap-8 3xl:gap-10 rounded-2xl lg:rounded-3xl px-4 py-10 lg:p-8">
          <div className="flex flex-col justify-center items-start gap-6 3xl:gap-8 w-full">
            <div className="flex flex-col justify-center items-start gap-4">
              <h1 className="text-[24px] md:text-[32px] text-primary font-bold leading-[140%] md:leading-[130%]">Login</h1>
              <p className="text-[12px] md:text-[14px] font-normal leading-[150%] text-primary">Enter your credentials to access your dashboard.</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col justify-center items-start gap-6 3xl:gap-8 w-full">
              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col justify-center items-start gap-2 w-full">
                <label className="text-[12px] md:text-[14px] font-bold leading-[150%] text-primary">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                  className="border border-[#D9D9D9] rounded-lg p-4  outline-none focus:border-secondary transition-colors placeholder:text-[#707070] w-full text-[12px] md:text-[14px] font-normal leading-[150%] text-primary transition-all duration-300 ease-in-out"
                />
              </div>

              {/* PIN */}
              <div className="flex flex-col justify-center items-start gap-2 w-full">
                <div className="w-full flex justify-between items-center">
                  <label className="text-[12px] md:text-[14px] font-bold leading-[150%] text-primary">
                    PIN 
                  </label>
                  <a href="#" className="text-secondary text-[12px] md:text-[14px] font-normal leading-[150%] cursor-pointer">
                    Forgot pin?
                  </a>
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  required
                  maxLength={8}
                  autoComplete="current-password"
                  className="w-full p-4 rounded-lg border border-[#D9D9D9] outline-none focus:border-secondary transition-colors placeholder:text-[#707070]  text-[12px] md:text-[14px] font-normal leading-[150%] text-primary transition-all duration-300 ease-in-out"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-secondary text-primary text-[14px] font-bold leading-[150%] disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-5px] rounded-lg cursor-pointer transition-all duration-300 ease-in-out "
              >
                {loading ? "Verifying..." : "Sign in"}
              </button>
            </form>
          </div>
          <div className="w-full h-[1px] bg-[#E8E8E8]">
          </div>
          <p className="text-[12px] md:text-[14px] font-medium leading-[150%] text-primary">Don't have an account? <a href="#" className="text-[12px] md:text-[14px] font-bold leading-[150%]">Contact Support</a></p>
        </div>
        <p className="text-[12px] text-white font-medium leading-[150%] text-center pt-10 md:pt-0">© 2026 TreeHubly Inc. All rights reserved. • Privacy Policy • Terms of Service</p>
      </div>
    </div>
  )
}
