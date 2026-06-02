import admin from "firebase-admin";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();
const db = admin.firestore();
const MERCADO_PAGO_ACCESS_TOKEN = defineSecret("MERCADO_PAGO_ACCESS_TOKEN");

const OPENPIX_PROD = "https://api.openpix.com.br/api/v1";
const OPENPIX_SANDBOX = "https://api.openpix.com.br/api/v1";
const MERCADO_PAGO_API = "https://api.mercadopago.com";
const NEXO_SUBSCRIPTION_AMOUNT = Number(process.env.NEXO_SUBSCRIPTION_AMOUNT || 99.9);

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

function mercadoPagoToken() {
  const token = MERCADO_PAGO_ACCESS_TOKEN.value() || "";
  if (!token) {
    throw new HttpsError("failed-precondition", "Token Mercado Pago da assinatura Nexo.io não configurado no backend.");
  }
  return token;
}

async function mercadoPagoFetch(path, options = {}) {
  const response = await fetch(`${MERCADO_PAGO_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mercadoPagoToken()}`,
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpsError("internal", payload?.message || payload?.error || "Falha na comunicação com Mercado Pago.", payload);
  }
  return payload;
}

function nextDueDate(months = 1) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function mercadoPagoPaymentStatus(status) {
  return ["approved", "accredited"].includes(status) ? "approved" : status || "pending";
}

function isMercadoPagoPaid(status) {
  return ["approved", "accredited"].includes(status);
}

function payerIdentification(document = "") {
  const digits = String(document || "").replace(/\D/g, "");
  if (!digits) return undefined;
  return {
    type: digits.length > 11 ? "CNPJ" : "CPF",
    number: digits,
  };
}

export const createNexoSubscriptionCharge = onCall({ region: "southamerica-east1", secrets: [MERCADO_PAGO_ACCESS_TOKEN] }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Faça login para continuar.");
  const { tenantId, tenant, profile } = await getTenantForUser(request.auth.uid);
  if (!["owner", "admin", "manager"].includes(profile.role)) {
    throw new HttpsError("permission-denied", "Somente administrador pode regularizar assinatura.");
  }

  const correlationID = `nexo-sub-${tenantId}-${Date.now()}`;
  const payload = {
    transaction_amount: Number(NEXO_SUBSCRIPTION_AMOUNT.toFixed(2)),
    description: `Assinatura Nexo.io - ${tenant.name || tenantId}`,
    payment_method_id: "pix",
    external_reference: correlationID,
    metadata: {
      tenant_id: tenantId,
      correlation_id: correlationID,
      product: "nexoio_subscription",
    },
    payer: {
      email: profile.email || "",
      first_name: tenant.name || profile.name || "Cliente Nexo.io",
      identification: payerIdentification(tenant.document),
    },
  };

  const payment = await mercadoPagoFetch("/v1/payments", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "X-Idempotency-Key": correlationID,
    },
  });
  const transactionData = payment.point_of_interaction?.transaction_data || {};
  const qrCodeBase64 = transactionData.qr_code_base64 || "";
  const brCode = transactionData.qr_code || "";
  const paymentLinkUrl = transactionData.ticket_url || "";
  const providerPaymentId = String(payment.id || "");
  const status = mercadoPagoPaymentStatus(payment.status);

  await db.doc(`tenants/${tenantId}/subscriptionCharges/${correlationID}`).set({
    tenant_id: tenantId,
    correlationID,
    provider: "mercado_pago",
    providerPaymentId,
    amount: NEXO_SUBSCRIPTION_AMOUNT,
    status,
    brCode,
    qrCodeImage: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : "",
    paymentLinkUrl,
    raw: payment,
    createdBy: request.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  await db.doc(`tenants/${tenantId}`).set({
    subscriptionProvider: "mercado_pago",
    subscriptionStatus: "pending_payment",
    subscriptionAmount: NEXO_SUBSCRIPTION_AMOUNT,
    subscriptionChargeId: correlationID,
    subscriptionPaymentId: providerPaymentId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    correlationID,
    providerPaymentId,
    amount: NEXO_SUBSCRIPTION_AMOUNT,
    status,
    brCode,
    qrCodeImage: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : "",
    paymentLinkUrl,
  };
});

export const checkNexoSubscriptionCharge = onCall({ region: "southamerica-east1", secrets: [MERCADO_PAGO_ACCESS_TOKEN] }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Faça login para continuar.");
  const { tenantId } = await getTenantForUser(request.auth.uid);
  const correlationID = request.data?.correlationID;
  if (!correlationID) throw new HttpsError("invalid-argument", "Informe a cobrança.");

  const chargeRef = db.doc(`tenants/${tenantId}/subscriptionCharges/${correlationID}`);
  const chargeSnap = await chargeRef.get();
  const providerPaymentId = chargeSnap.data()?.providerPaymentId;
  if (!providerPaymentId) throw new HttpsError("not-found", "Pagamento Mercado Pago não encontrado.");

  const payment = await mercadoPagoFetch(`/v1/payments/${encodeURIComponent(providerPaymentId)}`, { method: "GET" });
  const status = mercadoPagoPaymentStatus(payment.status);
  const paid = isMercadoPagoPaid(status);

  await chargeRef.set({
    status,
    paidAt: payment.date_approved || null,
    raw: payment,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  if (paid) {
    await db.doc(`tenants/${tenantId}`).set({
      subscriptionStatus: "active",
      subscriptionProvider: "mercado_pago",
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
    paidAt: payment.date_approved || null,
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

export const nexoSubscriptionWebhook = onRequest({ region: "southamerica-east1", secrets: [MERCADO_PAGO_ACCESS_TOKEN] }, async (request, response) => {
  const event = request.body || request.query || {};
  const paymentId = event?.data?.id || event?.id || request.query?.["data.id"];
  if (!paymentId) {
    response.status(200).json({ ok: true, ignored: true });
    return;
  }

  const payment = await mercadoPagoFetch(`/v1/payments/${encodeURIComponent(paymentId)}`, { method: "GET" });
  const correlationID = payment.external_reference || payment.metadata?.correlation_id || "";
  const matches = await db.collectionGroup("subscriptionCharges").where("providerPaymentId", "==", String(paymentId)).limit(1).get();
  const fallbackMatches = matches.empty && correlationID
    ? await db.collectionGroup("subscriptionCharges").where("correlationID", "==", correlationID).limit(1).get()
    : matches;

  if (fallbackMatches.empty) {
    response.status(200).json({ ok: true, ignored: true });
    return;
  }

  const chargeRef = fallbackMatches.docs[0].ref;
  const tenantRef = chargeRef.parent.parent;
  const status = mercadoPagoPaymentStatus(payment.status);
  const paid = isMercadoPagoPaid(status);

  await chargeRef.set({
    status,
    paidAt: payment.date_approved || null,
    webhookEvent: event.type || request.query?.type || "",
    rawWebhook: event,
    raw: payment,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  if (paid && tenantRef) {
    await tenantRef.set({
      subscriptionStatus: "active",
      subscriptionProvider: "mercado_pago",
      subscriptionAmount: NEXO_SUBSCRIPTION_AMOUNT,
      subscriptionDueDate: nextDueDate(1),
      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  response.status(200).json({ ok: true });
});
