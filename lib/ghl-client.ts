import { GHL_CONFIG } from "./ghl-config";
const BASE = "https://services.leadconnectorhq.com";

const HEADERS = {
  Authorization: `Bearer ${process.env.GHL_API_TOKEN}`,
  Version: "2021-07-28",
  "Content-Type": "application/json",
};

// 1. Buscar contacto por correo (Devuelve contacto completo con datos para login)
export async function getContactByEmail(email: string) {
  const res = await fetch(
    `${BASE}/contacts/search/duplicate?email=${email}&locationId=${GHL_CONFIG.locationId}`,
    { headers: HEADERS },
  );
  const data = await res.json();

  const contact = data.contact;

  if (!contact?.id) {
    return {
      success: false,
      contactId: null,
      name: null,
      email: null,
      pin: null,
    };
  }

  // Extrae el PIN del customFieldData
  const pinField = contact?.customFields?.find(
    (field: any) => field.id === GHL_CONFIG.customFields.pin,
  );

  return {
    success: res.ok,
    contactId: contact?.id || null,
    name:
      contact?.firstName && contact?.lastName
        ? `${contact.firstName} ${contact.lastName}`
        : contact?.firstName || contact?.name || "Usuario",
    email: contact?.email || null,
    pin: pinField?.value || null,
  };
}

// 2. Obtener la oportunidad del contacto (Extrae el ID y el Stage del primer elemento del arreglo 'opportunities')
export async function getOpportunity(contactId: string) {
  const res = await fetch(
    `${BASE}/opportunities/search?contact_id=${contactId}&pipeline_id=${GHL_CONFIG.pipeline.id}&location_id=${GHL_CONFIG.locationId}`,
    { headers: HEADERS },
  );
  const data = await res.json();

  // Accedemos de forma segura a la primera oportunidad del arreglo
  const firstOpportunity = data.opportunities?.[0];

  // Retorna solo las llaves esenciales para el flujo
  return {
    opportunityId: firstOpportunity?.id || null,
    pipelineStageId: firstOpportunity?.pipelineStageId || null,
  };
}

// 3. Mover al siguiente paso (Extrae la confirmación del cambio dentro del objeto 'opportunity')
export async function moveToNextStage(opportunityId: string, stageId: string) {
  const res = await fetch(`${BASE}/opportunities/${opportunityId}`, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify({
      pipelineId: GHL_CONFIG.pipeline.id,
      pipelineStageId: stageId,
    }),
  });
  const data = await res.json();

  // Retorna un estado de control ultra minimalista
  return {
    success: res.ok,
    opportunityId: data.opportunity?.id || null,
    currentStageId: data.opportunity?.pipelineStageId || null,
  };
}
