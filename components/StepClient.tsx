"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useClientStore } from "@/store/clientStore"
import { Step, AuthUser } from "@/types"
import { TOTAL_STEPS } from "@/lib/steps"

interface Props {
  step: Step
  user: AuthUser
}

export default function StepClient({ step, user }: Props) {
  const router = useRouter()
  const { steps, completeStep } = useClientStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const isDone = steps[step.id] === true
  const [completing, setCompleting] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  // ── Escuchar evento del iframe de GHL ────────────────────────
  // GHL emite window.message cuando el cliente envía el formulario.
  // Cuando llegue ese evento, marcamos el paso como completado automáticamente.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // GHL envía diferentes tipos de eventos según el widget
      // Ajusta estas condiciones cuando tengas los iframes reales
      const isGHLSubmit =
        event.data?.type === "form_submitted" ||
        event.data?.type === "appointment_booked" ||
        event.data?.event === "form_submitted" ||
        // Algunos widgets de GHL envían esto:
        (typeof event.data === "string" && event.data.includes("form_submitted"))

      if (isGHLSubmit && !isDone) {
        handleComplete()
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone])

  async function handleComplete() {
    if (isDone || completing) return
    setCompleting(true)

    try {
      // 1. Actualizar UI de inmediato (optimistic update)
      completeStep(step.id)
      setJustCompleted(true)

      // 2. Notificar a n8n en background para actualizar GHL
      await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepNumber: step.id }),
      })

      // 3. Ir al siguiente paso o al dashboard si era el último
      setTimeout(() => {
        if (step.id === TOTAL_STEPS) {
          router.push("/dashboard")
        } else {
          router.push(`/dashboard/step/${step.id + 1}`)
        }
      }, 1500)
    } catch {
      // Si falla la API, el progreso local ya se guardó — no es bloqueante
      console.error("Error al sincronizar paso con GHL")
    } finally {
      setCompleting(false)
    }
  }

  return (
    // ── AQUÍ VA TU UI DEL FIGMA ──────────────────────────────────
    // Variables disponibles:
    //   step.id → número del paso (1-8)
    //   step.title → título del paso
    //   step.description → descripción
    //   step.iframeUrl → URL del widget de GHL (null hasta que te la pasen)
    //   isDone → boolean, true si este paso ya está completado
    //   completing → boolean, true mientras se está procesando
    //   justCompleted → boolean, true justo después de completar (para animación)
    //   handleComplete() → función para marcar paso como completado manualmente
    //   iframeRef → ref para el iframe (necesario para detectar eventos)
    // ────────────────────────────────────────────────────────────

    <div className="w-full flex justify-center items-center min-h-screen">
      <div className="container-full flex flex-col justify-center items-center w-full py-20 h-full gap-8">

        {/* REEMPLAZA DESDE AQUÍ CON TU DISEÑO DEL FIGMA */}

        {/* Header de navegación */}
        <div className="w-full flex justify-start items-center gap-4 ">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-paragraph hover:text-secondary transition-colors flex items-center gap-1.5 duration-300 ease-in-out cursor-pointer"
          >
            ← Volver
          </button>
          <span className="text-secondary">/</span>
          <span className="text-sm text-paragraph">
            Paso {step.id} de {TOTAL_STEPS}
          </span>
        </div>

        {/* Título del paso */}
        <div className="flex flex-col justify-center items-center gap-8">
          <div className="flex items-center gap-3 ">
            <div className={`
              w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0
              ${isDone || justCompleted
                ? "bg-gray-900 text-white"
                : "border-2 border-secondary text-paragraph"
              }
            `}>
              {isDone || justCompleted ? "✓" : step.id}
            </div>
            <h1 className="text-paragraph text-[24px] md:text-[32px] font-semibold leading-[150%]">{step.title}</h1>
          </div>
          <p className="text-[12px] md:text-[14px] text-paragraph font-normal leading-[150%] grow wfull md:w-[70%] text-center">
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
        </div>

        {/* Área del iframe / widget de GHL */}
        <div className="border rounded-3xl border-secondary ">
          {step.iframeUrl ? (
            <iframe
              ref={iframeRef}
              src={step.iframeUrl}
              className="w-full min-h-[500px] border-0"
              title={step.title}
              allow="camera; microphone"
            />
          ) : (
            // Placeholder mientras no tienes la URL del iframe
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Widget pendiente</p>
              <p className="text-xs text-gray-400 max-w-xs">
                
              </p>
              <code className="mt-3 text-xs font-mono text-gray-300 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                step.iframeUrl — paso {step.id}
              </code>
            </div>
          )}
        </div>

        {/* Botón de completar manual */}
        {/* Este botón es el fallback si el iframe no emite el evento automáticamente */}
        {!isDone && !justCompleted && (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="py-3.25 w-full md:px-14 md:w-auto bg-secondary rounded-lg text-primary font-bold text-[14px] hover:translate-y-[-5px] transition-all duration-300 ease-in-out disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer"
          >
            {completing ? "Guardando..." : "Completé este paso →"}
          </button>
        )}

        {/* Estado completado */}
        {(isDone || justCompleted) && (
          <div className="w-full h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center gap-2">
            <span className="text-sm font-medium text-green-600">
              ✓ Paso completado
            </span>
          </div>
        )}

        {/* HASTA AQUÍ */}
      </div>
    </div>
  )
}
