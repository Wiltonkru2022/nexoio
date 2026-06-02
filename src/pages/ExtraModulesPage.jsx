import { CheckCircle2, CloudDownload, CloudUpload, Link2, Printer, QrCode, Save, Target, Ticket } from "lucide-react";
import { Badge, Input, Line, Metric, Panel, SelectField } from "../components/ui";
import { formatMoney } from "../lib/storeData";
import { maskCurrency } from "../lib/validation";

export function BackupPage({ tenant, products, services, customers, orders, workOrders, cashSessions, cashMovements, coupons }) {
  const collections = [
    ["Produtos", products],
    ["Serviços", services],
    ["Clientes", customers],
    ["Vendas", orders],
    ["OS", workOrders],
    ["Caixas", cashSessions],
    ["Movimentações", cashMovements],
    ["Cupons", coupons],
  ];

  function downloadBackup() {
    const payload = {
      exportedAt: new Date().toISOString(),
      tenant,
      products,
      services,
      customers,
      orders,
      workOrders,
      cashSessions,
      cashMovements,
      coupons,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexoio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel title="Backup">
        <CloudDownload className="text-teal-600" size={34} />
        <p className="mt-3 text-sm font-semibold text-slate-500">Gere um arquivo JSON com os dados principais da loja para conferência e guarda externa.</p>
        <button type="button" onClick={downloadBackup} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-black text-white">
          <CloudDownload size={18} /> Baixar backup
        </button>
      </Panel>
      <Panel title="Dados inclusos">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {collections.map(([label, items]) => (
            <Metric key={label} title={label} value={items.length} detail="registros" tone="neutral" />
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function IntegracoesPage({ storeForm, setStoreForm, saving, handleStoreSubmit }) {
  const googleDriveActive = Boolean(storeForm.googleDriveBackupEnabled);
  const openPixActive = Boolean(storeForm.openPixEnabled && storeForm.openPixAppId);

  return (
    <form className="grid gap-5" onSubmit={handleStoreSubmit}>
      <div className="grid gap-4 xl:grid-cols-3">
        <Metric title="Google Drive" value={googleDriveActive ? "Ativo" : "Inativo"} detail={storeForm.googleDriveFolder || "Backup não configurado"} tone={googleDriveActive ? "emerald" : "neutral"} />
        <Metric title="OpenPix" value={openPixActive ? "Conectado" : "Opcional"} detail={openPixActive ? "Pix dinâmico liberado no PDV" : "Pix manual continua funcionando"} tone={openPixActive ? "sky" : "neutral"} />
        <Metric title="Webhooks" value={storeForm.webhookUrl ? "Configurado" : "Não usado"} detail="Eventos externos e automações" tone="neutral" />
      </div>

      <Panel
        title="Backup por Google Drive"
        actions={<Badge tone={googleDriveActive ? "success" : "neutral"}>{googleDriveActive ? "Ativo" : "Desativado"}</Badge>}
      >
        <div className="grid gap-4">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
            <CloudUpload className="mt-0.5 h-5 w-5 shrink-0" />
            <p>Quando ativado, o sistema deixa a configuração pronta para enviar backups automáticos para a pasta Google Drive da loja.</p>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <span>
              <span className="block text-sm font-black text-slate-900">Ativar backup no Google Drive</span>
              <span className="block text-xs font-semibold text-slate-500">A conexão OAuth/servidor pode ser plugada nesta configuração.</span>
            </span>
            <input type="checkbox" checked={googleDriveActive} onChange={(event) => setStoreForm({ ...storeForm, googleDriveBackupEnabled: event.target.checked })} className="h-5 w-5 accent-emerald-600" />
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            <Input label="E-mail Google da loja" value={storeForm.googleDriveEmail || ""} onChange={(value) => setStoreForm({ ...storeForm, googleDriveEmail: value })} placeholder="loja@gmail.com" />
            <Input label="Pasta de backup" value={storeForm.googleDriveFolder || ""} onChange={(value) => setStoreForm({ ...storeForm, googleDriveFolder: value })} placeholder="Nexo.io Backups" />
            <SelectField label="Frequência" value={storeForm.googleDriveFrequency || "daily"} onChange={(value) => setStoreForm({ ...storeForm, googleDriveFrequency: value })}>
              <option value="manual">Manual</option>
              <option value="daily">Diária</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </SelectField>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
            <CheckCircle2 size={16} className={googleDriveActive ? "text-emerald-600" : "text-slate-400"} />
            Status: {googleDriveActive ? "pronto para integração com Drive" : "aguardando ativação"}
          </div>
        </div>
      </Panel>

      <Panel
        title="Pix no PDV via OpenPix"
        actions={<Badge tone={openPixActive ? "success" : "neutral"}>{openPixActive ? "Ativo no PDV" : "Opcional"}</Badge>}
      >
        <div className="grid gap-4">
          <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-900">
            <QrCode className="mt-0.5 h-5 w-5 shrink-0" />
            <p>OpenPix não é obrigatório. Se a loja ativar e preencher as credenciais, o PDV passa a indicar Pix dinâmico; se não ativar, o Pix manual continua disponível.</p>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <span>
              <span className="block text-sm font-black text-slate-900">Usar OpenPix no Pix do PDV</span>
              <span className="block text-xs font-semibold text-slate-500">As cobranças dinâmicas devem ser geradas por backend/server function para proteger o token.</span>
            </span>
            <input type="checkbox" checked={Boolean(storeForm.openPixEnabled)} onChange={(event) => setStoreForm({ ...storeForm, openPixEnabled: event.target.checked })} className="h-5 w-5 accent-blue-600" />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="App ID / Conta OpenPix" value={storeForm.openPixAppId || ""} onChange={(value) => setStoreForm({ ...storeForm, openPixAppId: value })} placeholder="Identificação da loja na OpenPix" />
            <Input label="Token/API Key OpenPix" value={storeForm.openPixApiKey || ""} onChange={(value) => setStoreForm({ ...storeForm, openPixApiKey: value })} placeholder="Cole o token da OpenPix" />
            <SelectField label="Modo" value={storeForm.openPixMode || "sandbox"} onChange={(value) => setStoreForm({ ...storeForm, openPixMode: value })}>
              <option value="sandbox">Teste/Sandbox</option>
              <option value="production">Produção</option>
            </SelectField>
            <Input label="Webhook OpenPix" value={storeForm.openPixWebhookUrl || ""} onChange={(value) => setStoreForm({ ...storeForm, openPixWebhookUrl: value })} placeholder="URL para confirmação de pagamento" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-600">
            Próximo passo técnico: criar endpoint seguro para gerar QR Code, consultar status da cobrança e receber webhook de pagamento confirmado.
          </div>
        </div>
      </Panel>

      <Panel title="Outras integrações">
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="WhatsApp comercial" value={storeForm.whatsapp || ""} onChange={(value) => setStoreForm({ ...storeForm, whatsapp: value })} />
          <Input label="Webhook externo" value={storeForm.webhookUrl || ""} onChange={(value) => setStoreForm({ ...storeForm, webhookUrl: value })} placeholder="https://..." />
        </div>
      </Panel>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
          <Link2 size={16} /> Salvar integrações
        </button>
      </div>
    </form>
  );
}

export function ImpressoesPage({ storeForm, setStoreForm, saving, handleStoreSubmit }) {
  return (
    <Panel title="Impressões">
      <form className="grid gap-4" onSubmit={handleStoreSubmit}>
        <div className="grid gap-3 md:grid-cols-3">
          <Input label="Impressora padrão" value={storeForm.printerName || ""} onChange={(value) => setStoreForm({ ...storeForm, printerName: value })} placeholder="80mm / navegador" />
          <Input label="Largura do cupom" value={storeForm.receiptWidth || "80mm"} onChange={(value) => setStoreForm({ ...storeForm, receiptWidth: value })} />
          <Input label="Serie recibo" value={storeForm.receiptSeries || "NEXO"} onChange={(value) => setStoreForm({ ...storeForm, receiptSeries: value })} />
        </div>
        <Input label="Mensagem no comprovante" value={storeForm.receiptMessage || ""} onChange={(value) => setStoreForm({ ...storeForm, receiptMessage: value })} placeholder="Obrigado pela preferência" />
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
            <Printer size={16} /> Salvar impressões
          </button>
        </div>
      </form>
    </Panel>
  );
}

export function CuponsPage({ coupons, couponForm, setCouponForm, saving, handleCouponSubmit }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Panel title="Cadastrar cupom">
        <form className="grid gap-3" onSubmit={handleCouponSubmit}>
          <Input label="Código" required value={couponForm.code} onChange={(value) => setCouponForm({ ...couponForm, code: value.toUpperCase() })} />
          <Input label="Valor" value={couponForm.value} onChange={(value) => setCouponForm({ ...couponForm, value })} mask={couponForm.type === "fixed" ? maskCurrency : undefined} />
          <Input label="Validade" type="date" value={couponForm.expiresAt} onChange={(value) => setCouponForm({ ...couponForm, expiresAt: value })} />
          <label className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-3 text-sm font-black">
            Cupom ativo
            <input type="checkbox" checked={couponForm.active !== false} onChange={(event) => setCouponForm({ ...couponForm, active: event.target.checked })} className="h-5 w-5 accent-blue-600" />
          </label>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
            <Ticket size={16} /> Salvar cupom
          </button>
        </form>
      </Panel>
      <Panel title="Cupons cadastrados">
        <div className="space-y-2">
          {coupons.map((coupon) => (
            <Line key={coupon.id} label={`${coupon.code} - ${coupon.type === "percent" ? `${coupon.value}%` : formatMoney(coupon.value)}`} value={coupon.active === false ? "Inativo" : "Ativo"} />
          ))}
          {!coupons.length && <p className="text-sm font-semibold text-neutral-500">Nenhum cupom cadastrado.</p>}
        </div>
      </Panel>
    </div>
  );
}

export function MetasPage({ metrics, storeForm, setStoreForm, saving, handleStoreSubmit }) {
  const revenueGoal = Number(String(storeForm.revenueGoal || "0").replace(/\./g, "").replace(",", ".")) || 0;
  const ticketGoal = Number(String(storeForm.ticketGoal || "0").replace(/\./g, "").replace(",", ".")) || 0;
  const revenueProgress = revenueGoal ? Math.min((metrics.revenueTotal / revenueGoal) * 100, 100) : 0;
  const ticketProgress = ticketGoal ? Math.min((metrics.averageTicket / ticketGoal) * 100, 100) : 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Panel title="Definir metas">
        <form className="grid gap-3" onSubmit={handleStoreSubmit}>
          <Input label="Meta de faturamento" value={storeForm.revenueGoal || ""} onChange={(value) => setStoreForm({ ...storeForm, revenueGoal: value })} mask={maskCurrency} />
          <Input label="Meta de ticket medio" value={storeForm.ticketGoal || ""} onChange={(value) => setStoreForm({ ...storeForm, ticketGoal: value })} mask={maskCurrency} />
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
            <Save size={16} /> Salvar metas
          </button>
        </form>
      </Panel>
      <Panel title="Acompanhamento">
        <div className="grid gap-3 md:grid-cols-2">
          <Metric title="Faturamento" value={formatMoney(metrics.revenueTotal)} detail={`${revenueProgress.toFixed(0)}% da meta`} tone="sky" />
          <Metric title="Ticket médio" value={formatMoney(metrics.averageTicket)} detail={`${ticketProgress.toFixed(0)}% da meta`} tone="emerald" />
        </div>
        <div className="mt-5 space-y-4">
          <Progress label="Meta de faturamento" value={revenueProgress} />
          <Progress label="Meta de ticket médio" value={ticketProgress} />
        </div>
      </Panel>
    </div>
  );
}

function Progress({ label, value }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-black text-slate-700">
        <span className="inline-flex items-center gap-2"><Target size={16} /> {label}</span>
        <span>{value.toFixed(0)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}
