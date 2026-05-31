"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useClientStore } from "@/store/clientStore";
import { getStepsStatus } from "@/lib/steps";
import { Step, AuthUser } from "@/types";
import { TOTAL_STEPS } from "@/lib/steps";

interface Props {
  step: Step;
  user: AuthUser;
}

export default function StepClient({ step, user }: Props) {
  const router = useRouter();
  const [completeError, setCompleteError] = useState("");
  const { steps, completeStep, currentStageId, opportunityId } =
    useClientStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isDone = steps[step.id] === true;
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // ── Verificar si el paso está bloqueado basado en el currentStageId ──
  useEffect(() => {
    if (currentStageId) {
      const stepsStatus = getStepsStatus(currentStageId);
      const stepStatus = stepsStatus.find((s) => s.step === step.id);

      if (stepStatus && !stepStatus.unlocked) {
        setIsBlocked(true);
        // Redirigir al dashboard después de 2 segundos si intenta acceder bloqueado
        const timer = setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStageId, step.id, router]);

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
        (typeof event.data === "string" &&
          event.data.includes("form_submitted"));

      if (isGHLSubmit && !isDone) {
        handleComplete();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone]);

  async function handleComplete() {
    if (isDone || completing) return;
    setCompleting(true);
    setCompleteError("");

    try {
      // 1. Actualizar UI de inmediato (optimistic update)
      completeStep(step.id);
      setJustCompleted(true);

      // 2. Notificar a API en background para actualizar GHL
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepNumber: step.id, opportunityId }),
      });

      const data = await res.json();

      if (!data.success) {
        setCompleteError(data.error || "Error al guardar el paso");
        setCompleting(false);
        return;
      }

      // 3. Ir al siguiente paso o al dashboard si era el último
      {
        /*setTimeout(() => {
        if (step.id === TOTAL_STEPS) {
          router.push("/dashboard");
        } else {
          router.push(`/dashboard/step/${step.id + 1}`);
        }
      }, 1000);*/
      }
    } catch (error) {
      console.error("Error al sincronizar paso con GHL:", error);
      setCompleteError("Error de conexión. Intenta de nuevo.");
      setCompleting(false);
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
        {/* MENSAJE DE PASO BLOQUEADO */}
        {isBlocked && (
          <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className="text-lg font-bold text-red-700 mb-2">
              Paso Bloqueado
            </h2>
            <p className="text-sm text-red-600 mb-4">
              Necesitas completar los pasos anteriores para acceder a este.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        )}

        {!isBlocked && (
          <>
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
                <div
                  className={`
              w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0
              ${
                isDone || justCompleted
                  ? "bg-gray-900 text-white"
                  : "border-2 border-secondary text-paragraph"
              }
            `}
                >
                  {isDone || justCompleted ? "✓" : step.id}
                </div>
                <h1 className="text-paragraph text-[24px] md:text-[32px] font-semibold leading-[150%]">
                  {step.title}
                </h1>
              </div>
              <p className="text-[12px] md:text-[14px] text-paragraph font-normal leading-[150%] grow wfull md:w-[70%] text-center">
                {Array.isArray(step.description)
                  ? step.description.map((segment, idx) => (
                      <span key={idx}>
                        {segment.href ? (
                          <a
                            href={segment.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary underline hover:no-underline"
                          >
                            {segment.text}
                          </a>
                        ) : (
                          segment.text
                        )}
                      </span>
                    ))
                  : step.description}
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
                    <svg
                      className="w-5 h-5 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Widget pendiente
                  </p>
                  <p className="text-xs text-gray-400 max-w-xs"></p>
                  <code className="mt-3 text-xs font-mono text-gray-300 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    step.iframeUrl — paso {step.id}
                  </code>
                </div>
              )}
            </div>

            {/* Error state */}
            {completeError && (
              <div className="w-full rounded-lg bg-red-50 border border-red-200 px-6 py-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    {completeError}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Por favor intenta nuevamente o contacta soporte.
                  </p>
                </div>
              </div>
            )}

            {/* Botón de completar manual - MEJORADO */}
            {/* Este botón es para testing durante desarrollo */}
            {!isDone && !justCompleted && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className={`w-full md:w-auto py-3 px-8 rounded-lg font-bold text-[14px] leading-[150%] transition-all duration-300 flex items-center justify-center gap-2 ${
                  completing
                    ? "bg-secondary/70 text-primary/70 cursor-wait"
                    : "bg-secondary text-primary hover:bg-secondary/95 hover:shadow-lg hover:translate-y-[-3px] active:translate-y-0 cursor-pointer"
                } ${completeError ? "ring-2 ring-red-400" : ""}`}
              >
                {completing ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span>Completé este paso</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
            )}

            {/* Estado completado */}
            {(isDone || justCompleted) && (
              <div className="w-full rounded-lg bg-green-50 border border-green-200 px-6 py-4 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-bold text-green-700">
                  ✓ Paso completado
                </span>
              </div>
            )}

            {/* HASTA AQUÍ */}
          </>
        )}
      </div>
    </div>
  );
}
