import { auth } from "../firebase";

const FUNCTIONS_BASE_URL = "https://southamerica-east1-nexoio-4b7ae.cloudfunctions.net";

async function callSubscriptionApi(path, data = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Faça login para continuar.");
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Não foi possível concluir a operação.");
  }
  return payload.result;
}

export async function createNexoSubscriptionCharge() {
  return callSubscriptionApi("createNexoSubscriptionChargeApi");
}

export async function checkNexoSubscriptionCharge(correlationID) {
  return callSubscriptionApi("checkNexoSubscriptionChargeApi", { correlationID });
}
