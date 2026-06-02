import { useState } from "react";
import { CheckCircle2, Copy, LogOut, QrCode, RefreshCw } from "lucide-react";
import { BrandLogo, Notice } from "../components/ui";
import { formatMoney } from "../lib/storeData";
import { checkNexoSubscriptionCharge, createNexoSubscriptionCharge } from "../lib/subscription";

function paymentErrorMessage(error, fallback) {
  const message = String(error?.message || "");
  if (/permission|permiss/i.test(message)) return "Você não tem permissão para executar esta ação.";
  if (/network|fetch/i.test(message)) return "Falha de conexão. Verifique sua internet e tente novamente.";
  if (/token|backend/i.test(message)) return "A integração de pagamento ainda não está configurada corretamente.";
  return fallback;
}

export function SubscriptionPage({ tenant, user, onLogout }) {
  const [charge, setCharge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function generateCharge() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await createNexoSubscriptionCharge();
      setCharge(result);
      setMessage("Cobrança Pix gerada. Após o pagamento, clique em verificar.");
    } catch (err) {
      setError(paymentErrorMessage(err, "Não foi possível gerar a cobrança."));
    } finally {
      setLoading(false);
    }
  }

  async function verifyPayment() {
    if (!charge?.correlationID && !tenant?.subscriptionChargeId) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await checkNexoSubscriptionCharge(charge?.correlationID || tenant.subscriptionChargeId);
      if (result.paid) {
        setMessage("Pagamento confirmado. O sistema será liberado em instantes.");
      } else {
        setMessage("Pagamento ainda não confirmado pelo Mercado Pago.");
      }
    } catch (err) {
      setError(paymentErrorMessage(err, "Não foi possível consultar o pagamento."));
    } finally {
      setLoading(false);
    }
  }

  async function copyPix() {
    if (!charge?.brCode) return;
    await navigator.clipboard.writeText(charge.brCode);
    setMessage("Código Pix copiado.");
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-5xl items-center gap-4 px-5">
          <BrandLogo />
          <div className="ml-auto text-right text-sm">
            <p className="font-black">{tenant?.name || "Loja Nexo.io"}</p>
            <p className="font-semibold text-slate-500">{user?.email}</p>
          </div>
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Assinatura Nexo.io</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Regularize sua assinatura para liberar o sistema.</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
            O acesso ao PDV, vendas, produtos, clientes e OS fica disponível após a confirmação do Pix pelo Mercado Pago.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <InfoCard title="Plano" value={tenant?.plan || "starter"} />
            <InfoCard title="Mensalidade" value={formatMoney(tenant?.subscriptionAmount || 1)} />
            <InfoCard title="Status" value={statusLabel(tenant?.subscriptionStatus)} />
          </div>
          <div className="mt-6 grid gap-2">
            {["Pagamento via Pix Mercado Pago", "Liberação automática por webhook", "Dados da loja preservados"].map((item) => (
              <p key={item} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <CheckCircle2 size={16} className="text-emerald-600" /> {item}
              </p>
            ))}
          </div>
        </section>

        <aside className="rounded-xl border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-700">
              <QrCode size={22} />
            </span>
            <div>
              <h2 className="text-xl font-black">Pagamento Pix</h2>
              <p className="text-sm font-semibold text-slate-500">Mercado Pago Pix</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <button type="button" onClick={generateCharge} disabled={loading} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              {loading ? "Processando..." : "Gerar Pix da assinatura"}
            </button>
            {(charge?.qrCodeImage || charge?.paymentLinkUrl) && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                {charge.qrCodeImage && <img src={charge.qrCodeImage} alt="QR Code Pix" className="mx-auto h-52 w-52 object-contain" />}
                {charge.paymentLinkUrl && (
                  <a href={charge.paymentLinkUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white">
                    Abrir pagamento
                  </a>
                )}
              </div>
            )}
            {charge?.brCode && (
              <button type="button" onClick={copyPix} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">
                <Copy size={16} /> Copiar Pix
              </button>
            )}
            <button type="button" onClick={verifyPayment} disabled={loading || (!charge?.correlationID && !tenant?.subscriptionChargeId)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-3 text-sm font-black text-emerald-700 disabled:opacity-50">
              <RefreshCw size={16} /> Verificar pagamento
            </button>
            {message && <Notice tone="success">{message}</Notice>}
            {error && <Notice tone="danger">{error}</Notice>}
          </div>
        </aside>
      </main>
    </div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function statusLabel(status) {
  const labels = {
    active: "Ativa",
    trial: "Teste",
    pending_payment: "Aguardando pagamento",
    overdue: "Vencida",
    canceled: "Cancelada",
    blocked: "Bloqueada",
  };
  return labels[status] || "Ativa";
}
