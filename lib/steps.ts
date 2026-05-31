import { GHL_CONFIG } from "./ghl-config";
import { Step } from "@/types";

// ────────────────────────────────────────────────────────────────
// ETAPAS DEL PIPELINE EN ORDEN
// Mapea cada stage ID de GHL a su posición (1-8)
// ────────────────────────────────────────────────────────────────
const STAGE_ORDER = [
  GHL_CONFIG.pipeline.stages.paso1,
  GHL_CONFIG.pipeline.stages.paso2,
  GHL_CONFIG.pipeline.stages.paso3,
  GHL_CONFIG.pipeline.stages.paso4,
  GHL_CONFIG.pipeline.stages.paso5,
  GHL_CONFIG.pipeline.stages.paso6,
  GHL_CONFIG.pipeline.stages.paso7,
  GHL_CONFIG.pipeline.stages.paso8,
  GHL_CONFIG.pipeline.stages.completo,
];

// ────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL: Determina estado visual de cada paso
// Recibe el stageId actual del usuario (de GHL)
// Retorna array con restricciones: unlocked, completed, current
// ────────────────────────────────────────────────────────────────
export function getStepsStatus(currentStageId: string) {
  const currentIndex = STAGE_ORDER.indexOf(currentStageId);

  return Array.from({ length: 8 }, (_, i) => ({
    step: i + 1,
    unlocked: i <= currentIndex, // Pasos 1-actual están desbloqueados
    completed: i < currentIndex, // Pasos antes del actual están completados
    current: i === currentIndex, // Marca el paso en el que está ahora
  }));
}

// ────────────────────────────────────────────────────────────────
// CONVERTIR NÚMERO DE PASO A STAGE ID (para avanzar pasos)
// ────────────────────────────────────────────────────────────────
export function getStageIdForStep(stepNumber: number): string | null {
  if (stepNumber < 1 || stepNumber > 8) return null;
  return STAGE_ORDER[stepNumber - 1] || null;
}

// ────────────────────────────────────────────────────────────────
// OBTENER PASOS COMPLETADOS DESDE UN STAGE ID
// Retorna: { 1: true, 2: true, 3: false, ... }
// ────────────────────────────────────────────────────────────────
export function getCompletedStepsByStage(
  stageId: string,
): Record<number, boolean> {
  const stepsStatus = getStepsStatus(stageId);
  const completed: Record<number, boolean> = {};

  stepsStatus.forEach(({ step, completed: isCompleted }) => {
    completed[step] = isCompleted;
  });

  return completed;
}

// ────────────────────────────────────────────────────────────────
// Cuando el encargado de GHL te pase las URLs de los iframes,
// simplemente reemplaza el null por la URL correspondiente.
// Ejemplo: iframeUrl: "https://api.leadconnectorhq.com/widget/form/XXXX"
// ────────────────────────────────────────────────────────────────

export const STEPS: Step[] = [
  {
    id: 1,
    title: "Programa Llamada de Setup Técnica",
    description: [
      {
        text: "Agenda tu llamada técnica para obtener acceso a Facebook/Instagram. Responderemos todas tus preguntas y te ayudaremos en cada paso del camino. ",
      },
      { text: "Descarga Zoom", href: "#" },
      { text: " y accede desde una computadora al momento de la llamada." },
    ],
    buttonText: "Agendar llamada",
    iframeUrl: null, // TODO: reemplazar con URL de calendario GHL
  },
  {
    id: 2,
    title: "Programa Llamada de Kickoff",
    description:
      "La llamada de Kickoff es donde te reunirás con tu Client Success Manager para presentarte nuestra propuesta de marketing (el marketing calendar).",
    buttonText: "Agendar llamada",
    iframeUrl: null, // TODO: reemplazar con URL de calendario GHL
  },
  {
    id: 3,
    title: "Información del Negocio",
    description: "¡Información básica sobre tu negocio! (Pan comido).",
    buttonText: "Completar",
    iframeUrl: null, // TODO: reemplazar con URL de formulario GHL
  },
  {
    id: 4,
    title: "Suscriptores de Texto/Email",
    description:
      "¿Tienes una base de datos de correo electrónico o suscriptores de teléfono/texto?",
    buttonText: "Subir datos",
    iframeUrl: null, // TODO: reemplazar con URL de formulario GHL
  },
  {
    id: 5,
    title: "Sube las fotos de tu comida",
    description: [
      {
        text: "¡Envíanos todas tus fotos de comida! Si no tienes fotos, avísanos a la brevedad. ",
      },
      { text: "Haz clic aquí", href: "#" },
      { text: " para ver nuestra Guía de fotografía de alimentos." },
    ],
    buttonText: "Subir fotos",
    iframeUrl: null, // TODO: reemplazar con URL de formulario GHL
  },
  {
    id: 6,
    title: "Formulario de autorización de tarjeta de crédito",
    description:
      "Completa este formulario de tarjeta de crédito para contar con un método de pago principal y de respaldo en tu cuenta de anuncios de Facebook.",
    buttonText: "Autorizar tarjeta",
    iframeUrl: null, // TODO: reemplazar con URL de formulario GHL
  },
  {
    id: 7,
    title: "Facebook & acceso a la cuenta de Ads",
    description:
      "¡Danos acceso de administrador a Facebook con solo unos pocos clics! Necesitas darnos acceso de admin para obtener el acceso adecuado. ¿Aún estás teniendo problemas? Reserva una Llamada Técnica para más ayuda.",
    buttonText: "Dar acceso",
    iframeUrl: null, // TODO: reemplazar con URL de formulario GHL
  },
  {
    id: 8,
    title: "Firma el Acuerdo de Servicio",
    description:
      "Por favor firma el Acuerdo de Servicio que te enviamos por correo electrónico. El asunto del correo electrónico debe decir: “Signature requested by Treehubly”.",
    buttonText: "Revisar correo",
    iframeUrl: null, // TODO: reemplazar con URL de formulario/documento GHL
  },
];

export const TOTAL_STEPS = STEPS.length;

export function getStep(id: number): Step | undefined {
  return STEPS.find((s) => s.id === id);
}

export function getFirstIncompleteStep(
  completedSteps: Record<number, boolean>,
): number {
  const incomplete = STEPS.find((s) => !completedSteps[s.id]);
  return incomplete?.id ?? 1;
}
