import { useMemo, useState } from "react";
import { ArrowLeft, Edit3, Plus, Save, Trash2 } from "lucide-react";
import { Badge, Input, Line, Modal, Panel, SelectField } from "../components/ui";
import { formatMoney, initialOsForm, initialServiceForm } from "../lib/storeData";
import { maskCurrency, maskPhone } from "../lib/validation";

function moneyInput(value) {
  if (value === "" || value === undefined || value === null) return "";
  return Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AssistenciaPage({
  tenant,
  storeForm,
  osForm,
  setOsForm,
  serviceForm,
  setServiceForm,
  services,
  products = [],
  customers = [],
  members = [],
  workOrders,
  saving,
  handleOsSubmit,
  handleServiceSubmit,
  updateWorkOrderStatus,
  deleteWorkOrder,
  errors,
  deleteService,
}) {
  const [view, setView] = useState("list");
  const [serviceView, setServiceView] = useState("list");
  const [selectedOs, setSelectedOs] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceSearch, setServiceSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const technicians = members.filter((member) => member.status !== "blocked" && ["owner", "manager"].includes(member.role));

  const selectedTotal = useMemo(() => {
    const servicesTotal = (osForm.services || []).reduce((sum, item) => sum + Number(item.price || 0), 0);
    const partsTotal = (osForm.parts || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
    return servicesTotal + partsTotal;
  }, [osForm.parts, osForm.services]);

  const filteredServices = useMemo(() => {
    const search = serviceSearch.toLowerCase().trim();
    if (!search) return [];
    return services.filter((service) => [service.name, service.sector, service.duration].filter(Boolean).some((field) => String(field).toLowerCase().includes(search))).slice(0, 8);
  }, [serviceSearch, services]);

  const filteredParts = useMemo(() => {
    const search = partSearch.toLowerCase().trim();
    if (!search) return [];
    return products.filter((product) => [product.name, product.sku, product.compatible, product.category].filter(Boolean).some((field) => String(field).toLowerCase().includes(search))).slice(0, 8);
  }, [partSearch, products]);

  const filteredCustomers = useMemo(() => {
    const search = customerSearch.toLowerCase().trim();
    if (!search) return [];
    return customers.filter((customer) => [customer.name, customer.phone, customer.document, customer.device].filter(Boolean).some((field) => String(field).toLowerCase().includes(search))).slice(0, 8);
  }, [customerSearch, customers]);

  function startNewOs() {
    setOsForm(initialOsForm);
    setCustomerSearch("");
    setPartSearch("");
    setServiceSearch("");
    setSelectedOs(null);
    setView("form");
  }

  function startEditOs(item) {
    setOsForm({
      ...initialOsForm,
      ...item,
      estimate: moneyInput(item.estimate),
      services: item.services || [],
      parts: item.parts || [],
    });
    setSelectedOs(null);
    setView("form");
  }

  async function submitOs(event) {
    const savedOs = await handleOsSubmit(event);
    if (savedOs) {
      printOsCopies(savedOs, tenant, storeForm);
      setView("list");
    }
  }

  function addOsService(service) {
    if ((osForm.services || []).some((item) => item.id === service.id)) return;
    setOsForm({ ...osForm, services: [...(osForm.services || []), { id: service.id, name: service.name, price: Number(service.price || 0), duration: service.duration }] });
  }

  function addOsPart(product) {
    const existing = (osForm.parts || []).find((item) => item.id === product.id);
    if (existing) {
      setOsForm({ ...osForm, parts: (osForm.parts || []).map((item) => item.id === product.id ? { ...item, quantity: Number(item.quantity || 1) + 1 } : item) });
      return;
    }
    setOsForm({ ...osForm, parts: [...(osForm.parts || []), { id: product.id, sku: product.sku, name: product.name, price: Number(product.price || 0), quantity: 1 }] });
  }

  function removeSelected(kind, id) {
    setOsForm({ ...osForm, [kind]: (osForm[kind] || []).filter((item) => item.id !== id) });
  }

  function startNewService() {
    setServiceForm(initialServiceForm);
    setSelectedService(null);
    setServiceView("form");
  }

  function startEditService(service) {
    setServiceForm({
      ...service,
      price: moneyInput(service.price),
      cost: moneyInput(service.cost),
    });
    setSelectedService(null);
    setServiceView("form");
  }

  async function submitService(event) {
    const ok = await handleServiceSubmit(event);
    if (ok) setServiceView("list");
  }

  if (view === "form") {
    return (
      <Panel
        title={osForm.id ? "Editar OS" : "Abrir OS"}
        actions={
          <button type="button" onClick={() => setView("list")} className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-black text-neutral-700">
            <ArrowLeft size={16} /> Voltar
          </button>
        }
      >
        <form className="grid gap-4" onSubmit={submitOs}>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <Input label="Buscar cliente cadastrado" value={customerSearch} onChange={setCustomerSearch} placeholder="Nome, telefone, CPF ou aparelho" />
            <div className="mt-2 grid gap-2">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    setOsForm({ ...osForm, customer: customer.name || "", phone: customer.phone || "", device: customer.device || "" });
                    setCustomerSearch("");
                  }}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-bold hover:border-sky-300"
                >
                  {customer.name} <span className="text-neutral-500">{customer.phone || "sem telefone"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Input label="Cliente" required value={osForm.customer} onChange={(value) => setOsForm({ ...osForm, customer: value })} error={errors.osCustomer} />
            <Input label="WhatsApp" value={osForm.phone} onChange={(value) => setOsForm({ ...osForm, phone: value })} mask={maskPhone} />
            <Input label="Aparelho" required value={osForm.device} onChange={(value) => setOsForm({ ...osForm, device: value })} error={errors.osDevice} />
            <Input label="IMEI/Serie" value={osForm.imei} onChange={(value) => setOsForm({ ...osForm, imei: value })} />
            <Input label="Senha" value={osForm.password} onChange={(value) => setOsForm({ ...osForm, password: value })} />
            <Input label="Prazo" type="date" value={osForm.dueDate} onChange={(value) => setOsForm({ ...osForm, dueDate: value })} />
            <Input label="Orcamento" value={osForm.estimate} onChange={(value) => setOsForm({ ...osForm, estimate: value })} mask={maskCurrency} />
            <SelectField
              label="Tecnico responsavel"
              value={osForm.technicianUid}
              onChange={(value) => {
                const technician = technicians.find((member) => member.id === value);
                setOsForm({ ...osForm, technicianUid: value, technicianName: technician?.name || technician?.email || "" });
              }}
            >
              <option value="">Sem tecnico</option>
              {technicians.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}
            </SelectField>
            <SelectField label="Prioridade" value={osForm.priority} onChange={(value) => setOsForm({ ...osForm, priority: value })}>
              <option>Normal</option>
              <option>Alta</option>
              <option>Garantia</option>
            </SelectField>
          </div>

          <label className="text-sm font-bold text-neutral-700">
            Defeito relatado
            <textarea value={osForm.issue} onChange={(event) => setOsForm({ ...osForm, issue: event.target.value })} className="mt-2 min-h-24 w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-sky-500" />
          </label>

          <div className="rounded-lg border border-sky-100 bg-sky-50 p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Input label="Buscar serviço técnico" value={serviceSearch} onChange={setServiceSearch} placeholder="Tela, bateria, limpeza..." />
                <div className="mt-2 grid gap-2">
                  {filteredServices.map((service) => (
                    <button key={service.id} type="button" onClick={() => addOsService(service)} className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-left text-sm font-bold hover:border-sky-300">
                      {service.name} <span className="text-sky-700">{formatMoney(service.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Input label="Buscar peca/produto" value={partSearch} onChange={setPartSearch} placeholder="Pelicula, tela, conector..." />
                <div className="mt-2 grid gap-2">
                  {filteredParts.map((product) => (
                    <button key={product.id} type="button" onClick={() => addOsPart(product)} className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-left text-sm font-bold hover:border-sky-300">
                      {product.name} <span className="text-sky-700">{formatMoney(product.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {(osForm.services || []).map((service) => <SelectedLine key={service.id} label={`Servico: ${service.name}`} value={formatMoney(service.price)} onRemove={() => removeSelected("services", service.id)} />)}
              {(osForm.parts || []).map((part) => <SelectedLine key={part.id} label={`Peca: ${part.quantity}x ${part.name}`} value={formatMoney(part.price * part.quantity)} onRemove={() => removeSelected("parts", part.id)} />)}
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-900">
                <span>Total tecnico sugerido</span>
                <span>{formatMoney(selectedTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              <Save size={16} /> Salvar OS
            </button>
          </div>
        </form>
      </Panel>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
      <Panel
        title="Bancada tecnica"
        actions={
          <button type="button" onClick={startNewOs} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-black text-white">
            <Plus size={16} /> Abrir OS
          </button>
        }
      >
        <div className="grid gap-3">
          {workOrders.map((item) => (
            <button key={item.id} type="button" onClick={() => setSelectedOs(item)} className="rounded-lg border border-neutral-200 bg-white p-4 text-left transition hover:border-sky-300 hover:bg-sky-50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-lg font-black">{item.code || (item.osNumber ? `OS #${item.osNumber}` : item.device)}</p>
                  <p className="truncate text-sm font-black text-slate-700">{item.device}</p>
                  <p className="text-sm text-neutral-500">{item.customer} - {item.phone}</p>
                  <p className="text-sm text-neutral-500">Tecnico: {item.technicianName || "Nao definido"}</p>
                  <p className="mt-2 text-sm font-semibold text-neutral-700">{item.issue || "Sem relato"}</p>
                  <p className="mt-2 text-sm font-black text-sky-700">Orcamento: {formatMoney(item.estimate)}</p>
                </div>
                <Badge tone={item.priority === "Alta" ? "danger" : item.priority === "Garantia" ? "sky" : "neutral"}>{item.priority}</Badge>
              </div>
            </button>
          ))}
          {!workOrders.length && <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm font-bold text-neutral-500">Nenhuma OS aberta.</p>}
        </div>
      </Panel>

      {serviceView === "form" ? (
        <Panel
          title={serviceForm.id ? "Editar serviço técnico" : "Novo serviço técnico"}
          actions={<button type="button" onClick={() => setServiceView("list")} className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-black text-neutral-700"><ArrowLeft size={16} /> Voltar</button>}
        >
          <form className="grid gap-3" onSubmit={submitService}>
            <Input label="Servico" required value={serviceForm.name} onChange={(value) => setServiceForm({ ...serviceForm, name: value })} error={errors.serviceName} />
            <Input label="Duracao" value={serviceForm.duration} onChange={(value) => setServiceForm({ ...serviceForm, duration: value })} />
            <Input label="Preco" value={serviceForm.price} onChange={(value) => setServiceForm({ ...serviceForm, price: value })} mask={maskCurrency} />
            <Input label="Custo" value={serviceForm.cost} onChange={(value) => setServiceForm({ ...serviceForm, cost: value })} mask={maskCurrency} />
            <Input label="Setor" value={serviceForm.sector} onChange={(value) => setServiceForm({ ...serviceForm, sector: value })} />
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
              <Save size={16} /> Salvar serviço
            </button>
          </form>
        </Panel>
      ) : (
        <Panel title="Serviços técnicos" actions={<button type="button" onClick={startNewService} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-black text-white"><Plus size={16} /> Novo serviço</button>}>
          <div className="grid gap-3">
            {services.map((service) => (
              <button key={service.id} type="button" onClick={() => setSelectedService(service)} className="rounded-lg border border-neutral-200 bg-white p-3 text-left transition hover:border-sky-300 hover:bg-sky-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-black text-neutral-900">{service.name}</p>
                    <p className="text-sm font-semibold text-neutral-500">{service.duration} - {service.sector}</p>
                  </div>
                  <span className="font-black text-sky-700">{formatMoney(service.price)}</span>
                </div>
              </button>
            ))}
            {!services.length && <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm font-bold text-neutral-500">Nenhum serviço cadastrado.</p>}
          </div>
        </Panel>
      )}

      <Modal title="Detalhes da OS" open={Boolean(selectedOs)} onClose={() => setSelectedOs(null)}>
        {selectedOs && (
          <div className="grid gap-4">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xl font-black">{selectedOs.code || (selectedOs.osNumber ? `OS #${selectedOs.osNumber}` : selectedOs.device)}</p>
              <p className="text-sm font-black text-slate-700">{selectedOs.device}</p>
              <p className="text-sm font-semibold text-neutral-500">{selectedOs.customer} - {selectedOs.phone}</p>
            </div>
            <div className="grid gap-2">
              <Line label="Status" value={selectedOs.status || "Orcamento"} />
              <Line label="Tecnico" value={selectedOs.technicianName || "Nao definido"} />
              <Line label="Prioridade" value={selectedOs.priority || "-"} />
              <Line label="Orcamento" value={formatMoney(selectedOs.estimate)} />
              <Line label="Defeito" value={selectedOs.issue || "-"} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {!!selectedOs.services?.length && <div className="rounded-lg bg-neutral-50 p-3 text-sm">
                <p className="font-black text-neutral-700">Servicos</p>
                {selectedOs.services.map((service) => <p key={service.id} className="mt-1 text-neutral-600">{service.name} - {formatMoney(service.price)}</p>)}
              </div>}
              {!!selectedOs.parts?.length && <div className="rounded-lg bg-neutral-50 p-3 text-sm">
                <p className="font-black text-neutral-700">Pecas</p>
                {selectedOs.parts.map((part) => <p key={part.id} className="mt-1 text-neutral-600">{part.quantity}x {part.name} - {formatMoney(part.price * part.quantity)}</p>)}
              </div>}
            </div>
            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {["Orcamento", "Aguardando peca", "Em reparo", "Pronto", "Entregue"].map((status) => (
                <button key={status} type="button" onClick={() => {
                  updateWorkOrderStatus(selectedOs.id, status);
                  setSelectedOs({ ...selectedOs, status });
                }} className={`rounded-lg px-3 py-2 text-xs font-black ${selectedOs.status === status ? "bg-sky-600 text-white" : "border border-neutral-300 text-neutral-600"}`}>
                  {status}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => printOsCopies(selectedOs, tenant, storeForm, true)} className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-3 text-sm font-black text-neutral-700">
                Imprimir 2ª via
              </button>
              <button type="button" onClick={() => startEditOs(selectedOs)} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-black text-white">
                <Edit3 size={16} /> Editar
              </button>
              <button type="button" onClick={() => {
                deleteWorkOrder(selectedOs.id);
                setSelectedOs(null);
              }} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-black text-white">
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal title="Detalhes do serviço" open={Boolean(selectedService)} onClose={() => setSelectedService(null)}>
        {selectedService && (
          <div className="grid gap-4">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xl font-black">{selectedService.name}</p>
              <p className="text-sm font-semibold text-neutral-500">{selectedService.duration} - {selectedService.sector}</p>
            </div>
            <div className="grid gap-2">
              <Line label="Preco" value={formatMoney(selectedService.price)} />
              <Line label="Custo" value={formatMoney(selectedService.cost)} />
              <Line label="Setor" value={selectedService.sector || "-"} />
              <Line label="Duracao" value={selectedService.duration || "-"} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => startEditService(selectedService)} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-black text-white">
                <Edit3 size={16} /> Editar
              </button>
              <button type="button" onClick={() => {
                deleteService(selectedService.id);
                setSelectedService(null);
              }} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-black text-white">
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function printOsCopies(os, tenant, settings = {}, duplicate = false) {
  const warranty = settings?.defaultWarranty || "90 dias";
  const deadline = os?.dueDate ? new Date(`${os.dueDate}T00:00:00`).toLocaleDateString("pt-BR") : settings?.defaultOsDays || "3 dias";
  const terms = settings?.osTerms || "O cliente declara estar ciente do defeito informado, do prazo estimado e das condições de garantia. A retirada do aparelho depende da conferência e assinatura do responsável.";
  const storeName = tenant?.name || settings?.name || "Nexo.io";
  const storePhone = settings?.whatsapp || settings?.phone || tenant?.whatsapp || tenant?.phone || "";
  const storeDocument = settings?.document || "";
  const storeLogo = settings?.logoUrl || tenant?.logoUrl || "";
  const address = [settings?.street, settings?.number, settings?.neighborhood, settings?.city, settings?.state].filter(Boolean).join(", ");
  const osLabel = os.code || (os.osNumber ? `OS #${os.osNumber}` : os.id || os.device || "-");
  const services = (os.services || []).map((service) => `<li>${escapeHtml(service.name)} - ${formatMoney(service.price)}</li>`).join("") || "<li>Nenhum serviço informado</li>";
  const parts = (os.parts || []).map((part) => `<li>${part.quantity || 1}x ${escapeHtml(part.name)} - ${formatMoney(Number(part.price || 0) * Number(part.quantity || 1))}</li>`).join("") || "<li>Nenhuma peça informada</li>";
  const copyTitle = duplicate ? "2ª via" : "Via";
  const copy = (label) => `
    <section class="copy">
      <div class="head">
        <div class="store">
          ${storeLogo ? `<img class="logo" src="${escapeHtml(storeLogo)}" alt="${escapeHtml(storeName)}" />` : ""}
          <h1>${escapeHtml(storeName)}</h1>
          <p>${escapeHtml(storeDocument)} ${storePhone ? `• ${escapeHtml(storePhone)}` : ""}</p>
          <p>${escapeHtml(address)}</p>
        </div>
        <div class="os-number">
          <strong>OS</strong>
          <span>${escapeHtml(osLabel)}</span>
          <small>${copyTitle} ${label}</small>
        </div>
      </div>
      <div class="grid">
        <p><strong>Cliente:</strong> ${escapeHtml(os.customer || "-")}</p>
        <p><strong>WhatsApp:</strong> ${escapeHtml(os.phone || "-")}</p>
        <p><strong>Aparelho:</strong> ${escapeHtml(os.device || "-")}</p>
        <p><strong>IMEI/Série:</strong> ${escapeHtml(os.imei || "-")}</p>
        <p><strong>Técnico:</strong> ${escapeHtml(os.technicianName || "Não definido")}</p>
        <p><strong>Status:</strong> ${escapeHtml(os.status || "Orçamento")}</p>
        <p><strong>Prazo:</strong> ${escapeHtml(deadline)}</p>
        <p><strong>Garantia:</strong> ${escapeHtml(warranty)}</p>
      </div>
      <p class="box"><strong>Defeito relatado:</strong><br>${escapeHtml(os.issue || "-")}</p>
      <div class="columns">
        <div><strong>Serviços</strong><ul>${services}</ul></div>
        <div><strong>Peças</strong><ul>${parts}</ul></div>
      </div>
      <div class="total">Orçamento: ${formatMoney(os.estimate)}</div>
      <p class="terms"><strong>Termos:</strong> ${escapeHtml(terms)}</p>
      <div class="signatures">
        <span>Assinatura do cliente</span>
        <span>Responsável da loja</span>
      </div>
    </section>`;
  const html = `<!doctype html>
    <html>
      <head>
        <title>OS ${escapeHtml(os.id || "")}</title>
        <style>
          body{font-family:Arial,sans-serif;margin:0;padding:18px;color:#0f172a}
          .copy{border:1px solid #cbd5e1;border-radius:10px;padding:16px;margin-bottom:18px;page-break-inside:avoid}
          .head{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #e2e8f0;padding-bottom:10px}
          .store{min-width:0}.logo{display:block;max-width:140px;max-height:56px;object-fit:contain;margin-bottom:6px}
          h1{font-size:20px;margin:0 0 4px}.head p{margin:2px 0;font-size:12px;color:#475569}
          .os-number{text-align:right}.os-number strong{display:block;font-size:12px;color:#64748b}.os-number span{display:block;font-size:22px;font-weight:800}.os-number small{font-weight:700;color:#2563eb}
          .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;margin:12px 0;font-size:13px}.grid p{margin:0}
          .box,.terms{border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:10px;font-size:13px}
          .columns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}.columns div{border:1px solid #e2e8f0;border-radius:8px;padding:10px;font-size:13px}
          ul{margin:8px 0 0;padding-left:18px}.total{text-align:right;font-size:16px;font-weight:800;margin:10px 0}
          .signatures{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:38px}.signatures span{border-top:1px solid #0f172a;text-align:center;padding-top:8px;font-size:12px}
          @media print{body{padding:8px}.copy{break-inside:avoid}}
        </style>
      </head>
      <body>${copy("do cliente")}${copy("do estabelecimento")}</body>
    </html>`;
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1200);
  };
  iframe.srcdoc = html;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

function SelectedLine({ label, value, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm">
      <span className="truncate font-bold text-slate-700">{label}</span>
      <span className="font-black text-slate-900">{value}</span>
      <button type="button" onClick={onRemove} className="rounded-md border border-red-200 px-2 py-1 text-xs font-black text-red-700">Remover</button>
    </div>
  );
}
