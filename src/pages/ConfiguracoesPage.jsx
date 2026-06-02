import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calculator,
  CreditCard,
  KeyRound,
  MonitorCog,
  Save,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Badge, Input, Panel } from "../components/ui";
import { maskCep, maskCpfCnpj, maskPhone } from "../lib/validation";

const modules = [
  { id: "loja", title: "Loja", description: "Identidade, documento e endereço", Icon: Building2 },
  { id: "pdv", title: "PDV", description: "Caixa, comprovante e impressão", Icon: MonitorCog },
  { id: "assistencia", title: "Assistência", description: "Prazo, garantia, bancada e termos da OS", Icon: Wrench },
  { id: "financeiro", title: "Financeiro", description: "PIX, recibo e exclusões", Icon: CreditCard },
  { id: "seguranca", title: "Segurança", description: "Senha e permissões", Icon: KeyRound },
  { id: "modulos", title: "Módulos", description: "Recursos ativos do sistema", Icon: BadgeCheck },
];

export function ConfiguracoesPage({ tenant, storeForm, setStoreForm, saving, errors, handleStoreSubmit, onPasswordChange }) {
  const [activeModule, setActiveModule] = useState("");
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [logoLoading, setLogoLoading] = useState(false);

  async function submitPassword(event) {
    event.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) return;
    const ok = await onPasswordChange(passwordForm.current, passwordForm.next);
    if (ok) setPasswordForm({ current: "", next: "", confirm: "" });
  }

  async function handleLogoFile(file) {
    if (!file) return;
    setLogoLoading(true);
    const logoUrl = await resizeLogoFile(file);
    setStoreForm({ ...storeForm, logoUrl });
    setLogoLoading(false);
  }

  if (!activeModule) {
    return (
      <div className="grid gap-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Configurações</h2>
          <p className="text-sm font-semibold text-slate-500">Escolha um módulo para configurar.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.Icon;
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveModule(module.id)}
                className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <Icon size={22} />
                </span>
                <p className="mt-4 text-lg font-black text-slate-950">{module.title}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{module.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Panel
      title={modules.find((module) => module.id === activeModule)?.title}
      actions={
        <button type="button" onClick={() => setActiveModule("")} className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-black text-neutral-700">
          <ArrowLeft size={16} /> Voltar
        </button>
      }
    >
      {activeModule !== "seguranca" && activeModule !== "modulos" && (
        <form className="grid gap-5" onSubmit={handleStoreSubmit}>
          {activeModule === "loja" && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Nome da loja" required value={storeForm.name} onChange={(value) => setStoreForm({ ...storeForm, name: value })} error={errors.storeName} />
                <Input label="CNPJ/CPF" value={storeForm.document} onChange={(value) => setStoreForm({ ...storeForm, document: value })} mask={maskCpfCnpj} error={errors.storeDocument} />
                <Input label="Telefone comercial" value={storeForm.phone} onChange={(value) => setStoreForm({ ...storeForm, phone: value })} mask={maskPhone} />
                <Input label="Plano" value={tenant?.plan || "starter"} onChange={() => {}} />
              </div>
              <div className="grid gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                <div className="grid h-28 w-40 place-items-center overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  {storeForm.logoUrl ? (
                    <img src={storeForm.logoUrl} alt="Logo da loja" className="h-full w-full object-contain p-2" />
                  ) : (
                    <span className="text-xs font-black uppercase text-neutral-400">Sem logo</span>
                  )}
                </div>
                <div className="grid gap-3">
                  <Input label="URL da logo" value={storeForm.logoUrl || ""} onChange={(value) => setStoreForm({ ...storeForm, logoUrl: value })} placeholder="https://..." />
                  <label className="min-w-0 text-sm font-bold text-neutral-700">
                    Logo do computador
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleLogoFile(event.target.files?.[0])}
                      className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-sky-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                    {logoLoading && <span className="mt-1 block text-xs font-bold text-sky-600">Preparando logo...</span>}
                  </label>
                  {storeForm.logoUrl && (
                    <button type="button" onClick={() => setStoreForm({ ...storeForm, logoUrl: "" })} className="w-fit rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-700">
                      Remover logo
                    </button>
                  )}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Input label="CEP" value={storeForm.cep} onChange={(value) => setStoreForm({ ...storeForm, cep: value })} mask={maskCep} error={errors.storeCep} />
                <Input label="Número" value={storeForm.number} onChange={(value) => setStoreForm({ ...storeForm, number: value })} />
                <div className="md:col-span-2">
                  <Input label="Rua" value={storeForm.street} onChange={(value) => setStoreForm({ ...storeForm, street: value })} />
                </div>
                <Input label="Bairro" value={storeForm.neighborhood} onChange={(value) => setStoreForm({ ...storeForm, neighborhood: value })} />
                <Input label="Cidade" value={storeForm.city} onChange={(value) => setStoreForm({ ...storeForm, city: value })} />
                <Input label="UF" value={storeForm.state} onChange={(value) => setStoreForm({ ...storeForm, state: value.toUpperCase().slice(0, 2) })} />
              </div>
            </>
          )}

          {activeModule === "pdv" && (
            <div className="grid gap-3 md:grid-cols-3">
              <Input label="Nome do caixa padrão" value={storeForm.cashRegisterName || "Caixa 01"} onChange={(value) => setStoreForm({ ...storeForm, cashRegisterName: value })} />
              <Input label="Mensagem do comprovante" value={storeForm.receiptMessage || ""} onChange={(value) => setStoreForm({ ...storeForm, receiptMessage: value })} placeholder="Obrigado pela preferência" />
              <Input label="Impressora" value={storeForm.printerName || ""} onChange={(value) => setStoreForm({ ...storeForm, printerName: value })} placeholder="80mm / navegador" />
            </div>
          )}

          {activeModule === "assistencia" && (
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-3">
                <Input label="Prazo padrão OS" value={storeForm.defaultOsDays || "3 dias"} onChange={(value) => setStoreForm({ ...storeForm, defaultOsDays: value })} />
                <Input label="Garantia padrão" value={storeForm.defaultWarranty || "90 dias"} onChange={(value) => setStoreForm({ ...storeForm, defaultWarranty: value })} />
                <Input label="Bancada/Setor" value={storeForm.serviceDesk || "Técnico"} onChange={(value) => setStoreForm({ ...storeForm, serviceDesk: value })} />
              </div>
              <label className="text-sm font-bold text-neutral-700">
                Termos impressos na OS
                <textarea
                  value={storeForm.osTerms || ""}
                  onChange={(event) => setStoreForm({ ...storeForm, osTerms: event.target.value })}
                  placeholder="Ex: O cliente declara estar ciente do prazo, garantia e condições do serviço."
                  className="mt-2 min-h-32 w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </label>
            </div>
          )}

          {activeModule === "financeiro" && (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <Input label="Chave PIX" value={storeForm.pixKey || ""} onChange={(value) => setStoreForm({ ...storeForm, pixKey: value })} />
                <Input label="Série recibo" value={storeForm.receiptSeries || "NEXO"} onChange={(value) => setStoreForm({ ...storeForm, receiptSeries: value })} />
                <Input label="Regime/observação fiscal" value={storeForm.taxNote || ""} onChange={(value) => setStoreForm({ ...storeForm, taxNote: value })} />
              </div>
              <label className="flex items-center justify-between gap-4 rounded-lg border border-red-100 bg-white px-4 py-3">
                <span>
                  <span className="block text-sm font-black text-slate-800">Permitir exclusão de vendas</span>
                  <span className="block text-xs font-semibold text-slate-500">Quando desligado, vendas só podem ser canceladas.</span>
                </span>
                <input type="checkbox" checked={Boolean(storeForm.allowOrderDelete)} onChange={(event) => setStoreForm({ ...storeForm, allowOrderDelete: event.target.checked })} className="h-5 w-5 accent-red-600" />
              </label>
            </>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              <Save size={16} /> Salvar configurações
            </button>
          </div>
        </form>
      )}

      {activeModule === "seguranca" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,480px)_1fr]">
          <form className="grid gap-3" onSubmit={submitPassword}>
            <Input label="Senha atual" type="password" value={passwordForm.current} onChange={(value) => setPasswordForm({ ...passwordForm, current: value })} />
            <Input label="Nova senha" type="password" value={passwordForm.next} onChange={(value) => setPasswordForm({ ...passwordForm, next: value })} />
            <Input label="Confirmar nova senha" type="password" value={passwordForm.confirm} onChange={(value) => setPasswordForm({ ...passwordForm, confirm: value })} error={passwordForm.confirm && passwordForm.next !== passwordForm.confirm ? "As senhas não conferem." : ""} />
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white">
              <KeyRound size={16} /> Alterar senha
            </button>
          </form>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <ShieldCheck className="text-emerald-600" size={28} />
            <p className="mt-3 font-black text-slate-900">Permissões por cargo</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="success">Dono/Admin</Badge>
              <Badge tone="sky">Gerente</Badge>
              <Badge tone="neutral">Caixa</Badge>
            </div>
          </div>
        </div>
      )}

      {activeModule === "modulos" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {["PDV", "Estoque", "Assistência", "Clientes", "Financeiro", "Relatórios"].map((module) => (
            <div key={module} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
              <span className="inline-flex items-center gap-2 font-black text-neutral-700"><Calculator size={16} /> {module}</span>
              <Badge tone="success">Ativo</Badge>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function resizeLogoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxSize = 520;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
