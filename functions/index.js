import admin from "firebase-admin";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();
const db = admin.firestore();
const WOOVI_API_KEY = defineSecret("WOOVI_API_KEY");

const OPENPIX_PROD = "https://api.openpix.com.br/api/v1";
const OPENPIX_SANDBOX = "https://api.woovi-sandbox.com/api/v1";
const NEXO_SUBSCRIPTION_AMOUNT = Number(process.env.NEXO_SUBSCRIPTION_AMOUNT || 99.9);
const NEXO_SUBSCRIPTION_MODE = process.env.NEXO_SUBSCRIPTION_MODE || "production";

async function getUserProfile(uid) {
  const snap = await db.doc(`userProfiles/${uid}`).get();
  if (!snap.exists) throw new HttpsError("permission-denied", "Perfil não encontrado.");
  return snap.data();
}

async function getTenantForUser(uid) {
  const profile = await getUserProfile(uid);
  const tenantId = profile.tenant_id;
  const tenantSnap = await db.doc(`tenants/${tenantId}`).get();
  if (!tenantSnap.exists) throw new HttpsError("not-found", "Loja não encontrada.");
  return { tenantId, tenant: tenantSnap.data(), profile };
}

function openPixBaseUrl(mode) {
  return mode === "production" ? OPENPIX_PROD : OPENPIX_SANDBOX;
}

function openPixToken(tenant) {
  const token = tenant.openPixApiKey || tenant.openPixAppId || "";
  if (!tenant.openPixEnabled || !token) {
    throw new HttpsError("failed-precondition", "OpenPix não está configurado para esta loja.");
  }
  return token;
}

async function openPixFetch(tenant, path, options = {}) {
  const response = await fetch(`${openPixBaseUrl(tenant.openPixMode)}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: openPixToken(tenant),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpsError("internal", payload?.error || payload?.message || "Falha na comunicação com OpenPix.", payload);
  }
  return payload;
}

function nexoSubscriptionToken() {
  const token = WOOVI_API_KEY.value() || "";
  if (!token) {
    throw new HttpsError("failed-precondition", "Token Woovi da assinatura Nexo.io nÃ£o configurado no backend.");
  }
  return token;
}

async function nexoWooviFetch(path, options = {}) {
  const response = await fetch(`${openPixBaseUrl(NEXO_SUBSCRIPTION_MODE)}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: nexoSubscriptionToken(),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpsError("internal", payload?.error || payload?.message || "Falha na comunicaÃ§Ã£o com Woovi.", payload);
  }
  return payload;
}

function nextDueDate(months = 1) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export const createNexoSubscriptionCharge = onCall({ region: "southamerica-east1", secrets: [WOOVI_API_KEY] }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "FaÃ§a login para continuar.");
  const { tenantId, tenant, profile } = await getTenantForUser(request.auth.uid);
  if (!["owner", "admin", "manager"].includes(profile.role)) {
    throw new HttpsError("permission-denied", "Somente administrador pode regularizar assinatura.");
  }

  const amount = Math.round(NEXO_SUBSCRIPTION_AMOUNT * 100);
  const correlationID = `nexo-sub-${tenantId}-${Date.now()}`;
  const payload = {
    value: amount,
    correlationID,
    comment: `Assinatura Nexo.io - ${tenant.name || tenantId}`,
    expiresIn: 3600,
    customer: {
      name: tenant.name || profile.name || profile.email || "Cliente Nexo.io",
      email: profile.email || "",
      phone: String(tenant.phone || tenant.whatsapp || "").replace(/\D/g, ""),
      taxID: tenant.document || "",
    },
  };

  const result = await nexoWooviFetch("/charge?return_existing=true", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const charge = result.charge || result;

  await db.doc(`tenants/${tenantId}/subscriptionCharges/${correlationID}`).set({
    tenant_id: tenantId,
    correlationID,
    provider: "woovi",
    amount: NEXO_SUBSCRIPTION_AMOUNT,
    status: charge.status || "ACTIVE",
    brCode: charge.brCode || charge.brcode || "",
    qrCodeImage: charge.qrCodeImage || charge.qrCodeImageUrl || "",
    paymentLinkUrl: charge.paymentLinkUrl || "",
    raw: charge,
    createdBy: request.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  await db.doc(`tenants/${tenantId}`).set({
    subscriptionProvider: "woovi",
    subscriptionStatus: "pending_payment",
    subscriptionAmount: NEXO_SUBSCRIPTION_AMOUNT,
    subscriptionChargeId: correlationID,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    correlationID,
    amount: NEXO_SUBSCRIPTION_AMOUNT,
    status: charge.status || "ACTIVE",
    brCode: charge.brCode || charge.brcode || "",
    qrCodeImage: charge.qrCodeImage || charge.qrCodeImageUrl || "",
    paymentLinkUrl: charge.paymentLinkUrl || "",
  };
});

export const checkNexoSubscriptionCharge = onCall({ region: "southamerica-east1", secrets: [WOOVI_API_KEY] }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "FaÃ§a login para continuar.");
  const { tenantId } = await getTenantForUser(request.auth.uid);
  const correlationID = request.data?.correlationID;
  if (!correlationID) throw new HttpsError("invalid-argument", "Informe a cobranÃ§a.");

  const result = await nexoWooviFetch(`/charge/${encodeURIComponent(correlationID)}`, { method: "GET" });
  const charge = result.charge || result;
  const status = charge.status || (charge.paidAt ? "COMPLETED" : "ACTIVE");
  const paid = ["COMPLETED", "PAID"].includes(status);

  await db.doc(`tenants/${tenantId}/subscriptionCharges/${correlationID}`).set({
    status,
    paidAt: charge.paidAt || charge.completedAt || null,
    raw: charge,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  if (paid) {
    await db.doc(`tenants/${tenantId}`).set({
      subscriptionStatus: "active",
      subscriptionProvider: "woovi",
      subscriptionAmount: NEXO_SUBSCRIPTION_AMOUNT,
      subscriptionDueDate: nextDueDate(1),
      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  return {
    correlationID,
    status,
    paid,
    paidAt: charge.paidAt || charge.completedAt || null,
  };
});

export const createOpenPixCharge = onCall({ region: "southamerica-east1" }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Faça login para continuar.");
  const { tenantId, tenant, profile } = await getTenantForUser(request.auth.uid);
  const amount = Math.round(Number(request.data?.amount || 0) * 100);
  if (!amount || amount <= 0) throw new HttpsError("invalid-argument", "Valor do Pix inválido.");

  const correlationID = request.data?.correlationID || `nexo-${tenantId}-${Date.now()}`;
  const customer = request.data?.customer || {};
  const payload = {
    value: amount,
    correlationID,
    comment: request.data?.comment || `Venda PDV ${tenant.name || "Nexo.io"}`,
    expiresIn: Number(request.data?.expiresIn || 900),
  };

  if (customer.name || customer.phone || customer.email || customer.document) {
    payload.customer = {
      name: customer.name || "Cliente balcão",
      email: customer.email || profile.email || "",
      phone: String(customer.phone || "").replace(/\D/g, ""),
      taxID: customer.document || "",
    };
  }

  const result = await openPixFetch(tenant, "/charge?return_existing=true", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const charge = result.charge || result;

  await db.doc(`tenants/${tenantId}/openPixCharges/${correlationID}`).set({
    tenant_id: tenantId,
    correlationID,
    amount: amount / 100,
    status: charge.status || "ACTIVE",
    brCode: charge.brCode || charge.brcode || "",
    qrCodeImage: charge.qrCodeImage || charge.qrCodeImageUrl || charge.paymentLinkUrl || "",
    paymentLinkUrl: charge.paymentLinkUrl || "",
    raw: charge,
    createdBy: request.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    correlationID,
    amount: amount / 100,
    status: charge.status || "ACTIVE",
    brCode: charge.brCode || charge.brcode || "",
    qrCodeImage: charge.qrCodeImage || charge.qrCodeImageUrl || "",
    paymentLinkUrl: charge.paymentLinkUrl || "",
  };
});

export const checkOpenPixCharge = onCall({ region: "southamerica-east1" }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Faça login para continuar.");
  const { tenantId, tenant } = await getTenantForUser(request.auth.uid);
  const correlationID = request.data?.correlationID;
  if (!correlationID) throw new HttpsError("invalid-argument", "Informe a cobrança.");

  const result = await openPixFetch(tenant, `/charge/${encodeURIComponent(correlationID)}`, { method: "GET" });
  const charge = result.charge || result;
  const status = charge.status || (charge.paidAt ? "COMPLETED" : "ACTIVE");

  await db.doc(`tenants/${tenantId}/openPixCharges/${correlationID}`).set({
    status,
    paidAt: charge.paidAt || charge.completedAt || null,
    transactionID: charge.transactionID || charge.transaction?.id || "",
    raw: charge,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    correlationID,
    status,
    paid: ["COMPLETED", "PAID"].includes(status),
    paidAt: charge.paidAt || charge.completedAt || null,
    transactionID: charge.transactionID || charge.transaction?.id || "",
  };
});

export const openPixWebhook = onRequest({ region: "southamerica-east1" }, async (request, response) => {
  const event = request.body || {};
  const charge = event.charge || event.pixQrCode || {};
  const correlationID = charge.correlationID || event.correlationID;
  if (!correlationID) {
    response.status(200).json({ ok: true, ignored: true });
    return;
  }

  const matches = await db.collectionGroup("openPixCharges").where("correlationID", "==", correlationID).limit(1).get();
  if (!matches.empty) {
    await matches.docs[0].ref.set({
      status: charge.status || (event.event === "OPENPIX:CHARGE_COMPLETED" ? "COMPLETED" : "ACTIVE"),
      paidAt: charge.paidAt || event.date || null,
      webhookEvent: event.event || "",
      rawWebhook: event,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  response.status(200).json({ ok: true });
});

export const nexoSubscriptionWebhook = onRequest({ region: "southamerica-east1", secrets: [WOOVI_API_KEY] }, async (request, response) => {
  const event = request.body || {};
  const charge = event.charge || event.pixQrCode || {};
  const correlationID = charge.correlationID || event.correlationID;
  if (!correlationID) {
    response.status(200).json({ ok: true, ignored: true });
    return;
  }

  const matches = await db.collectionGroup("subscriptionCharges").where("correlationID", "==", correlationID).limit(1).get();
  if (matches.empty) {
    response.status(200).json({ ok: true, ignored: true });
    return;
  }

  const chargeRef = matches.docs[0].ref;
  const tenantRef = chargeRef.parent.parent;
  const status = charge.status || (event.event === "OPENPIX:CHARGE_COMPLETED" ? "COMPLETED" : "ACTIVE");
  const paid = ["COMPLETED", "PAID"].includes(status);

  await chargeRef.set({
    status,
    paidAt: charge.paidAt || event.date || null,
    webhookEvent: event.event || "",
    rawWebhook: event,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  if (paid && tenantRef) {
    await tenantRef.set({
      subscriptionStatus: "active",
      subscriptionProvider: "woovi",
      subscriptionAmount: NEXO_SUBSCRIPTION_AMOUNT,
      subscriptionDueDate: nextDueDate(1),
      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  response.status(200).json({ ok: true });
});
