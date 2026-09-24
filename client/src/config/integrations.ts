export const INTEGRATIONS = {
  leadCapture: {
    webhookUrl: "https://pgiyjqnwomysftkdxwid.supabase.co/functions/v1/raio-x-lead",
  },
  salaDeComando: {
    groupUrl: "https://chat.whatsapp.com/J96mG0ZdJkSHFfBRenMQLM?s=sw&p=i&mlu=4&ilr=4",
  },
  analytics: { dataLayerName: "dataLayer", pixelId: "" },
};

type CapturePayload = {
  lead: { name: string; whatsapp: string; email: string };
  answers: Record<string, unknown>;
  result: {
    stage: string;
    overall: number;
    dimensions: {
      ownerDependency: number;
      teamAutonomy: number;
      delegation: number;
      operationControl: number;
    };
  };
  capturedAt: string;
};

export async function captureLead(payload: CapturePayload) {
  const body = {
    name: payload.lead.name,
    email: payload.lead.email,
    whatsapp: payload.lead.whatsapp,
    stage: payload.result.stage,
    overall_score: payload.result.overall,
    owner_dependency: payload.result.dimensions.ownerDependency,
    team_autonomy: payload.result.dimensions.teamAutonomy,
    delegation: payload.result.dimensions.delegation,
    operation_control: payload.result.dimensions.operationControl,
    answers: payload.answers,
    captured_at: payload.capturedAt,
  };
  const response = await fetch(INTEGRATIONS.leadCapture.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    localStorage.setItem(`rx_pending_${Date.now()}`, JSON.stringify(body));
    throw new Error(`Falha ao registrar lead (${response.status})`);
  }
  return response.json();
}

export function trackEvent(event: string, data: Record<string, unknown> = {}) {
  const w = window as any;
  w[INTEGRATIONS.analytics.dataLayerName] = w[INTEGRATIONS.analytics.dataLayerName] || [];
  w[INTEGRATIONS.analytics.dataLayerName].push({ event, ...data });
}

export function getSalaDeComandoUrl() {
  return INTEGRATIONS.salaDeComando.groupUrl;
}
