"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useClientStore } from "@/store/clientStore"
import { STEPS, TOTAL_STEPS } from "@/lib/steps"
import { getProgressPercent } from "@/lib/progress"
import { AuthUser } from "@/types"

interface Props {
  user: AuthUser
}

export default function DashboardClient({ user }: Props) {
  const router = useRouter()
  const { setUser, steps, completedCount, currentStep, syncSteps, logout } = useClientStore()

  // Hidratar el store con el usuario del servidor
  useEffect(() => {
    setUser(user)
  }, [user, setUser])

  // Sincronizar progreso real desde GHL al cargar
  useEffect(() => {
    async function syncFromGHL() {
      try {
        const res = await fetch("/api/progress/sync")
        const data = await res.json()
        if (data.success && data.steps) {
          syncSteps(data.steps)
        }
      } catch {
        // Si falla el sync, usa el estado local — no es crítico
      }
    }
    syncFromGHL()
  }, [syncSteps])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    logout()
    router.push("/login")
    router.refresh()
  }

  function handleStepClick(stepId: number) {
    router.push(`/dashboard/step/${stepId}`)
  }

  const percent = getProgressPercent(completedCount)
  const allDone = completedCount === TOTAL_STEPS

  return (
    // ── AQUÍ VA TU UI DEL FIGMA ──────────────────────────────────
    // Variables disponibles:
    //   user.name, user.email, user.initials → datos del usuario
    //   steps → { 1: true/false, 2: true/false, ... }
    //   completedCount → número de pasos completados (0-8)
    //   currentStep → id del paso actual
    //   percent → porcentaje 0-100
    //   allDone → boolean, true cuando completó los 8 pasos
    //   handleLogout() → función para cerrar sesión
    //   handleStepClick(stepId) → función para ir a un paso
    //   STEPS → array con los 8 pasos definidos
    //   TOTAL_STEPS → 8
    // ────────────────────────────────────────────────────────────
      <section className="w-full flex flex-col justify-center items-center ">
        <div className="w-full flex justify-center items-center border-b border-[#263A4B]">
          <div className="container-full flex justify-between items-center py-6 md:py-6.25">
            <Image src="/logo.svg" alt="Logo Treehubly" width={168} height={30} style={{ width: 'auto', height: 'auto' }} />
            <div className="flex justify-center items-center gap-6">
              <div className=" justify-center items-center gap-1.25 hidden md:flex">
                <div className="w-1 h-1 rounded-full bg-secondary"></div>
                <p className="text-[14px] font-normal leading-[150%] text-paragraph">Online System</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-[14px] font-semibold text-secondary leading-[150%] hover:translate-y-[-2px] transition-all duration-300 ease-in-out cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
        <div className="py-10 md:py-20 flex flex-col justify-center items-center gap-10 md:gap-20 container-full">
          <div className="flex flex-col justify-center items-center gap-8">
            <h1 className="text-[32px] md:text-[48px] text-paragraph font-bold leading-[130%] md:leading-[120%]">¡Bienvenido a <span className="text-secondary">bordo!</span></h1>
            <p className="text-[14px] font-normal leading-[150%] text-paragraph text-center">Por favor, completa los pasos de arranque (onboarding) hoy! Si completas todos los pasos a continuación, participarás <br className="hidden lg:block"/> en un sorteo para <span className="text-secondary font-bold">ganar un crédito de $250.</span> Si tienes preguntar o no sabes cómo completar alguno de los pasos,<br className="hidden lg:block"/> continúa con el próximo paso. Te ayudaremos con los pasos pendientes en tu llamada de setup técnica.</p>
          </div>
          <div className="aspect-343/193 md:aspect-1200/675 w-full h-auto rounded-3xl bg-secondary"></div>
          <div className="w-full md:w-[80%] flex flex-col justify-center items-center gap-2">
            <div className="w-full flex items-center justify-between">
              <p className="text-[12px] md:text-[14px] text-secondary font-bold leading-[150%]">{allDone ? "PROGRESO COMPLETADO" : "TU PROGRESO"}</p>
              <span className="text-[12px] md:text-[14px] text-paragraph font-bold leading-[150%]">{percent}% COMPLETADO</span>
            </div>
            {/* Barra de progreso */}
            <div className="w-full h-2 bg-[#263A4B] rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 justify-center items-stretch gap-4 md:gap-6">
            {STEPS.map((step) => {
              const isDone = steps[step.id] === true
              return (
                <div
                  key={step.id}
                  className={`
                    w-full flex flex-col justify-start items-start gap-6 px-4 md:px-8 py-6 md:pt-8 md:pb-[53px] bg-[#152232] rounded-3xl border grow 
                    ${isDone ? "border-secondary" : "border-[#263A4B]"}
                  `}
                >
                  <div className="w-full flex justify-between items-center">
                    <div className="bg-secondary/10 rounded-full border border-secondary py-1 px-4 flex justify-center items-center">
                      <p className="text-[12px] md:text-[14px] text-paragraph font-normal leading-[150%]">Step 0{step.id}</p>
                    </div>
                    {isDone ? (
                        <Image src="/check.svg" alt="Completado" width={24} height={24} />
                      ) : (
                        <Image src="/no-check.svg" alt="Pendiente" width={24} height={24} />
                      )}
                  </div>
                  <h2 className="text-[14px] md:text-[16px] font-bold leading-[150%] text-paragraph">{step.title}</h2>
                    <p className="text-[12px] md:text-[14px] text-paragraph font-normal leading-[150%] grow">
                      {Array.isArray(step.description) ? (
                        step.description.map((segment, idx) => (
                          <span key={idx}>
                            {segment.href ? (
                              <a href={segment.href} target="_blank" rel="noopener noreferrer" className="text-secondary underline hover:no-underline">
                                {segment.text}
                              </a>
                            ) : (
                              segment.text
                            )}
                          </span>
                        ))
                      ) : (
                        step.description
                      )}
                    </p>
                    <button className={`w-full  rounded-lg border border-secondary py-3 text-[14px] font-bold leading-[150%]   transition-all duration-300 ease-in-out ${isDone ? "bg-secondary/10 text-secondary" : "bg-secondary text-primary cursor-pointer hover:translate-y-[-3px]"} `} onClick={() => handleStepClick(step.id)} disabled={isDone}>
                      {step.buttonText}
                    </button>
                </div>
              )
            })}
          </div>
          <div className="flex flex-col justify-center items-center gap-8">
            <p className="text-[12px] md:text-[14px] text-paragraph font-normal leading-[150%] text-center">
              Una vez que completes todos los pasos de Onboarding, programaremos una llamada de Inicio/Kickoff con tu Account <br className="hidden lg:block"/> Manager, el Gerente encargado de tu cuenta, y luego lanzaremos la campaña
            </p>
            <button className={`rounded-lg border border-secondary py-3 text-[14px] font-bold leading-[150%]  hover:translate-y-[-3px] transition-all duration-300 ease-in-out bg-secondary text-primary px-0 md:px-14 w-full md:w-auto`} >
              ¿Tienes preguntas? FAQs       
            </button>
          </div>
        </div>
        <div className="flex w-full justify-center items-center py-6.25 border-t border-[#263A4B]">
          <div className="container-full flex justify-center items-center ">
            <p className="text-[12px] font-medium leading-[150%] text-paragraph text-center">© 2026 TreeHubly Inc. All rights reserved. • Privacy Policy • Terms of Service</p>
          </div>
        </div>
      </section>  
  )
}
