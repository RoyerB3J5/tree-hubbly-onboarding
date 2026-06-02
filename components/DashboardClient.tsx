"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useClientStore } from "@/store/clientStore";
import { STEPS, TOTAL_STEPS, getStepsStatus } from "@/lib/steps";
import { getProgressPercent } from "@/lib/progress";
import { AuthUser } from "@/types";

interface Props {
  user: AuthUser;
}

export default function DashboardClient({ user }: Props) {
  const router = useRouter();
  // isInitializing: true solo si NO tenemos datos en el store (primera carga)
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncError, setSyncError] = useState(false);

  const {
    setUser,
    steps,
    completedCount,
    currentStep,
    currentStageId,
    syncSteps,
    setCurrentStageId,
    setOpportunityId,
    logout,
  } = useClientStore();

  // Hidratar el store con el usuario del servidor
  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  // Sincronizar progreso: usar datos cached inmediatamente, sincronizar en background
  useEffect(() => {
    async function syncFromGHL() {
      try {
        setSyncError(false);
        const res = await fetch("/api/progress/sync");
        const data = await res.json();
        if (data.success && data.steps) {
          syncSteps(data.steps, data.currentStageId, data.opportunityId);
          if (data.currentStageId) {
            setCurrentStageId(data.currentStageId);
          }
          if (data.opportunityId) {
            setOpportunityId(data.opportunityId);
          }
        } else {
          setSyncError(true);
        }
      } catch {
        setSyncError(true);
      } finally {
        // Marcar que terminó la inicialización
        setIsInitializing(false);
      }
    }

    // Si tenemos datos en el store (del localStorage), no mostrar skeleton
    if (steps && Object.keys(steps).length > 0) {
      // Datos cached disponibles: sincronizar en background
      setIsInitializing(false);
      syncFromGHL();
    } else {
      // Sin datos cached: esperar la respuesta de la API
      syncFromGHL();
    }
  }, [syncSteps, setCurrentStageId, setOpportunityId]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    router.push("/login");
    router.refresh();
  }

  function handleStepClick(stepId: number) {
    // Solo permitir navegar a pasos desbloqueados
    if (currentStageId && stepsStatus) {
      const stepStatus = stepsStatus.find((s) => s.step === stepId);
      if (stepStatus && !stepStatus.unlocked) {
        return;
      }
    }
    router.push(`/dashboard/step/${stepId}`);
  }

  const percent = getProgressPercent(completedCount);
  const allDone = completedCount === TOTAL_STEPS;

  // Calcular el estado visual de cada paso basado en el currentStageId
  const stepsStatus = currentStageId ? getStepsStatus(currentStageId) : null;

  // ── SKELETON LOADER MIENTRAS CARGA ────────────────────────────
  if (isInitializing) {
    return (
      <section className="w-full flex flex-col justify-center items-center">
        {/* Header */}
        <div className="w-full flex justify-center items-center border-b border-[#263A4B]">
          <div className="container-full flex justify-between items-center py-6 md:py-6.25">
            <Image
              src="/logo.svg"
              alt="Logo Treehubly"
              width={168}
              height={30}
              style={{ width: "auto", height: "auto" }}
            />
            <div className="w-20 h-6 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="py-10 md:py-20 flex flex-col justify-center items-center gap-10 md:gap-20 container-full w-full">
          {/* Welcome Section Skeleton */}
          <div className="flex flex-col justify-center items-center gap-8 w-full">
            <div className="w-full md:w-[80%] space-y-3">
              <div className="h-12 bg-gray-300 rounded-lg animate-pulse mx-auto w-[60%]"></div>
              <div className="h-6 bg-gray-300 rounded animate-pulse mx-auto w-[80%]"></div>
              <div className="h-6 bg-gray-300 rounded animate-pulse mx-auto w-[75%]"></div>
            </div>
          </div>

          {/* Hero Image Skeleton */}
          <div className="aspect-343/193 md:aspect-1200/675 w-full h-auto rounded-3xl bg-gray-300 animate-pulse"></div>

          {/* Progress Bar Skeleton */}
          <div className="w-full md:w-[80%] flex flex-col justify-center items-center gap-3">
            <div className="w-full flex items-center justify-between">
              <div className="h-4 bg-gray-300 rounded animate-pulse w-[40%]"></div>
              <div className="h-4 bg-gray-300 rounded animate-pulse w-[30%]"></div>
            </div>
            <div className="w-full h-2 bg-gray-300 rounded-full animate-pulse"></div>
          </div>

          {/* Steps Grid Skeleton */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full flex flex-col justify-start items-start gap-4 px-4 md:px-8 py-6 md:pt-8 md:pb-[53px] rounded-3xl border border-[#263A4B] bg-[#152232] animate-pulse"
              >
                <div className="w-24 h-8 bg-gray-300 rounded-full"></div>
                <div className="w-[60%] h-5 bg-gray-300 rounded"></div>
                <div className="w-full space-y-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-[90%]"></div>
                </div>
                <div className="mt-auto w-full h-10 bg-gray-300 rounded-lg"></div>
              </div>
            ))}
          </div>

          {/* Bottom Section Skeleton */}
          <div className="flex flex-col justify-center items-center gap-4">
            <div className="h-6 bg-gray-300 rounded animate-pulse w-80"></div>
            <div className="h-10 bg-gray-300 rounded-lg animate-pulse w-48"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex w-full justify-center items-center py-6.25 border-t border-[#263A4B]">
          <div className="h-4 bg-gray-300 rounded animate-pulse w-96"></div>
        </div>
      </section>
    );
  }

  // ── ERROR STATE ────────────────────────────────────────────────
  if (syncError) {
    return (
      <section className="w-full flex flex-col justify-center items-center min-h-screen">
        <div className="w-full flex justify-center items-center border-b border-[#263A4B]">
          <div className="container-full flex justify-between items-center py-6 md:py-6.25">
            <Image
              src="/logo.svg"
              alt="Logo Treehubly"
              width={168}
              height={30}
              style={{ width: "auto", height: "auto" }}
            />
            <button
              onClick={handleLogout}
              className="text-[14px] font-semibold text-secondary leading-[150%] hover:translate-y-[-2px] transition-all duration-300 ease-in-out cursor-pointer"
            >
              Exit
            </button>
          </div>
        </div>
        <div className="py-20 flex flex-col justify-center items-center gap-6 container-full">
          <div className="flex flex-col justify-center items-center gap-4 max-w-md">
            <svg
              className="w-12 h-12 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 0v2m0-12v2m0 4v2m0 0v2"
              />
            </svg>
            <h2 className="text-[20px] font-bold text-paragraph">Sync Error</h2>
            <p className="text-[14px] text-paragraph text-center">
              We couldn't load your progress. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-secondary text-primary font-bold rounded-lg hover:bg-secondary/95 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex flex-col justify-center items-center ">
      <div className="w-full flex justify-center items-center border-b border-[#263A4B]">
        <div className="container-full flex justify-between items-center py-6 md:py-6.25">
          <Image
            src="/logo.svg"
            alt="Logo Treehubly"
            width={168}
            height={30}
            style={{ width: "auto", height: "auto" }}
          />
          <div className="flex justify-center items-center gap-6">
            <div className=" justify-center items-center gap-1.25 hidden md:flex">
              <div className="w-1 h-1 rounded-full bg-secondary"></div>
              <p className="text-[14px] font-normal leading-[150%] text-paragraph">
                Online System
              </p>
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
          <h1 className="text-[32px] md:text-[48px] text-paragraph font-semibold leading-[130%] md:leading-[120%]">
            ¡Bienvenido a <span className="text-secondary">bordo!</span>
          </h1>
          <p className="text-[14px] md:text-[16px] font-light leading-[150%] text-paragraph text-center">
            Por favor, completa los pasos de arranque (onboarding) hoy! Si
            completas todos los pasos a continuación, participarás{" "}
            <br className="hidden lg:block" /> en un sorteo para{" "}
            <span className="text-secondary font-bold">
              ganar un crédito de $250.
            </span>{" "}
            Si tienes preguntar o no sabes cómo completar alguno de los pasos,
            <br className="hidden lg:block" /> continúa con el próximo paso. Te
            ayudaremos con los pasos pendientes en tu llamada de setup técnica.
          </p>
        </div>
        <div className="aspect-343/193 md:aspect-1200/675 w-full h-auto rounded-3xl bg-secondary"></div>
        <div className="w-full md:w-[80%] flex flex-col justify-center items-center gap-2">
          <div className="w-full flex items-center justify-between">
            <p className="text-[12px] md:text-[14px] text-secondary font-medium leading-[150%]">
              {allDone ? "PROGRESO COMPLETADO" : "TU PROGRESO"}
            </p>
            <span className="text-[12px] md:text-[14px] text-paragraph font-medium leading-[150%]">
              {percent}% COMPLETADO
            </span>
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
            const isDone = steps[step.id] === true;
            const stepStatus = stepsStatus?.find((s) => s.step === step.id);
            const isUnlocked = stepStatus?.unlocked ?? true;
            const isLocked = !isUnlocked;

            return (
              <div
                key={step.id}
                className={`
                    w-full flex flex-col justify-start items-start gap-6 px-4 lg:px-8 py-6 lg:py-12  rounded-lg border grow transition-all duration-300 relative
                    ${isDone  ? "border-secondary bg-[#152232]" : "border-[#263A4B] bg-[#152232]"}
                  `}
              >
                {isLocked && (
                  <div className="absolute w-full h-full bg-[#0D1D2C]/60 z-5 top-0 right-0"></div>
                )}
                <div className="w-full flex justify-between items-center">
                  <div
                    className={`rounded-full border  py-1 px-4 flex justify-center items-center ${isDone || isLocked ? "bg-secondary/10 border-secondary " : "border-[#263A4B] bg-transparent"} `}
                  >
                    <p className="text-[12px] md:text-[14px] text-paragraph font-light leading-[150%]">
                      Step 0{step.id}
                    </p>
                  </div>
                  {isDone && (
                    <Image
                      src="/check.svg"
                      alt="Completado"
                      width={24}
                      height={24}
                    />
                  )}
                </div>
                <h2 className="text-[14px] md:text-[20px] font-medium leading-[150%] text-secondary">
                  {step.title}
                </h2>
                <p className="text-[12px] md:text-[16px] text-paragraph font-light leading-[150%] grow">
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
                <button
                  className={`flex justify-center items-center gap-2 w-full  rounded-[4px] border border-secondary py-3 text-[16px] font-medium leading-[150%]   transition-all duration-300 ease-in-out cursor-pointer ${isDone ? "bg-secondary text-primary " : "bg-transparent text-secondary  hover:translate-y-[-3px]"} `}
                  onClick={() => handleStepClick(step.id)}
                  disabled={isLocked}
                >
                  {isLocked && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M14.1673 7.49996V5.83329C14.1673 3.49996 12.334 1.66663 10.0007 1.66663C7.66732 1.66663 5.83398 3.49996 5.83398 5.83329V7.49996C4.41732 7.49996 3.33398 8.58329 3.33398 9.99996V15.8333C3.33398 17.25 4.41732 18.3333 5.83398 18.3333H14.1673C15.584 18.3333 16.6673 17.25 16.6673 15.8333V9.99996C16.6673 8.58329 15.584 7.49996 14.1673 7.49996ZM7.50065 5.83329C7.50065 4.41663 8.58398 3.33329 10.0007 3.33329C11.4173 3.33329 12.5007 4.41663 12.5007 5.83329V7.49996H7.50065V5.83329ZM10.9173 12.9166L10.834 13V14.1666C10.834 14.6666 10.5007 15 10.0007 15C9.50065 15 9.16732 14.6666 9.16732 14.1666V13C8.66732 12.5 8.58398 11.75 9.08398 11.25C9.58398 10.75 10.334 10.6666 10.834 11.1666C11.334 11.5833 11.4173 12.4166 10.9173 12.9166Z"
                        fill="#91D200"
                      />
                    </svg>
                  )}
                  {
                    isDone ? "Completado" : step.buttonText
                  }
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col justify-center items-center gap-8">
          <p className="text-[12px] md:text-[16px] text-paragraph font-normal leading-[150%] text-center">
            Una vez que completes todos los pasos de Onboarding, programaremos
            una llamada de Inicio/Kickoff con tu Account{" "}
            <br className="hidden lg:block" /> Manager, el Gerente encargado de
            tu cuenta, y luego lanzaremos la campaña
          </p>
          <button
            className={`rounded-lg border border-secondary py-3 text-[16px] font-semibold leading-[150%]  hover:translate-y-[-3px] transition-all duration-300 ease-in-out bg-secondary text-primary px-0 md:px-14 w-full md:w-auto`}
          >
            ¿Tienes preguntas? FAQs
          </button>
        </div>
      </div>
      <div className="flex w-full justify-center items-center py-6.25 border-t border-[#263A4B]">
        <div className="container-full flex justify-center items-center ">
          <p className="text-[12px] font-medium leading-[150%] text-paragraph text-center">
            © 2026 TreeHubly Inc. All rights reserved. • Privacy Policy • Terms
            of Service
          </p>
        </div>
      </div>
    </section>
  );
}
