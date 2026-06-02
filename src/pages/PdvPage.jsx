import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  BriefcaseBusiness,
  ClipboardCheck,
  CircleDollarSign,
  CreditCard,
  History,
  Gift,
  Landmark,
  Percent,
  Plus,
  Power,
  Printer,
  QrCode,
  ReceiptText,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserRoundPlus,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { Badge, Modal, Notice } from "../components/ui";
import { formatMoney } from "../lib/storeData";
import { checkOpenPixCharge, createOpenPixCharge } from "../lib/openpix";
import { printSaleReceipt as printSaleReceiptDocument } from "../lib/printing";
import { maskCpfCnpj, maskCurrency, maskPhone } from "../lib/validation";

const categories = ["Todos", "Capinha", "Película", "Carregador", "Cabo", "Fone", "Acessório", "Outros"];

const paymentOptions = [
  { id: "Dinheiro", label: "Dinheiro", Icon: Banknote },
  { id: "Pix", label: "PIX", Icon: QrCode },
  { id: "Cartao credito", label: "Cartão Crédito", Icon: CreditCard },
  { id: "Cartao debito", label: "Cartão Débito", Icon: CreditCard },
  { id: "Boleto", label: "Boleto", Icon: ReceiptText },
  { id: "Transferencia", label: "Transferencia", Icon: Landmark },
  { id: "Vale/Credito", label: "Vale/Crédito", Icon: Gift },
  { id: "Crediario", label: "Crediário", Icon: BriefcaseBusiness },
];

export function PdvPage({
  customerForm,
  setCustomerForm,
  productFilter,
  setProductFilter,
  filteredProducts,
  customers = [],
  services,
  cart,
  cartSummary,
  discount,
  setDiscount,
  couponCode,
  setCouponCode,
  applyCoupon,
  payments,
  setPayments,
  creditSurplus,
  setCreditSurplus,
  payment,
  setPayment,
  metrics,
  tenant,
  openCashSession,
  cashMovements = [],
  cashSummary,
  canManageCash,
  operatorName,
  openCashRegister,
  closeCashRegister,
  addCashMovement,
  lastReceipt,
  setLastReceipt,
  erro,
  saving,
  addProductToCart,
  addServiceToCart,
  addVoucherToCart,
  updateCartQuantity,
  clearCart,
  finishSale,
  handleCustomerSubmit,
  setActiveTab,
  errors,
}) {
  const [category, setCategory] = useState("Todos");
  const searchMode = "product";
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [splitAmount, setSplitAmount] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandMode, setCommandMode] = useState("product");
  const [commandQuery, setCommandQuery] = useState("");
  const [cashMovementModal, setCashMovementModal] = useState(null);
  const [cashMovementForm, setCashMovementForm] = useState({ amount: "", note: "" });
  const [cashCloseModal, setCashCloseModal] = useState(false);
  const [cashCloseForm, setCashCloseForm] = useState({ countedAmount: "", note: "" });
  const [cashHistoryOpen, setCashHistoryOpen] = useState(false);
  const [cashReceipt, setCashReceipt] = useState(null);
  const [voucherName, setVoucherName] = useState("Vale/Credito");
  const [voucherAmount, setVoucherAmount] = useState("");
  const [paymentInstallments, setPaymentInstallments] = useState("1");
  const [crediarioDueDate, setCrediarioDueDate] = useState("");
  const [pixCharge, setPixCharge] = useState(null);
  const [pixError, setPixError] = useState("");
  const [pixLoading, setPixLoading] = useState(false);
  const openPixReady = Boolean(tenant?.openPixEnabled && tenant?.openPixAppId && tenant?.openPixApiKey);
  const pendingOpenPix = payments.some((item) => item.method === "Pix" && item.provider === "OpenPix" && item.status !== "Confirmado");

  useEffect(() => {
    function openCommand(mode) {
      setCommandMode(mode);
      setCommandQuery("");
      setCommandOpen(true);
    }

    function handleShortcut(event) {
      if (!event.ctrlKey && !event.metaKey) return;
      const key = event.key.toLowerCase();
      if (key === "p") {
        event.preventDefault();
        openCommand("product");
      }
      if (key === "s") {
        event.preventDefault();
        openCommand("service");
      }
      if (key === "c") {
        event.preventDefault();
        openCommand("customer");
      }
      if (key === "v") {
        event.preventDefault();
        openCommand("voucher");
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const visibleProducts = useMemo(() => {
    if (category === "Todos") return filteredProducts;
    return filteredProducts.filter((product) => {
      const value = normalizeText(`${product.category || ""} ${product.name || ""}`);
      return value.includes(normalizeText(category));
    });
  }, [category, filteredProducts]);

  const visibleServices = useMemo(() => {
    const search = productFilter.toLowerCase().trim();
    if (!search) return services;
    return services.filter((service) => [service.name, service.sector, service.duration].filter(Boolean).some((field) => String(field).toLowerCase().includes(search)));
  }, [productFilter, services]);

  const commandResults = useMemo(() => {
    const search = normalizeText(commandQuery);
    if (commandMode === "product") {
      return filteredProducts
        .filter((product) => !search || normalizeText(`${product.name} ${product.sku} ${product.category} ${product.compatible}`).includes(search))
        .slice(0, 10);
    }
    if (commandMode === "service") {
      return services
        .filter((service) => !search || normalizeText(`${service.name} ${service.sector} ${service.duration}`).includes(search))
        .slice(0, 10);
    }
    if (commandMode === "customer") {
      return customers
        .filter((customer) => !search || normalizeText(`${customer.name} ${customer.phone} ${customer.document} ${customer.device}`).includes(search))
        .slice(0, 10);
    }
    return [];
  }, [commandMode, commandQuery, customers, filteredProducts, services]);

  function openSearch(mode) {
    setCommandMode(mode);
    setCommandQuery("");
    setCommandOpen(true);
  }

  function chooseCommandResult(item) {
    if (commandMode === "product") addProductToCart(item);
    if (commandMode === "service") addServiceToCart(item);
    if (commandMode === "customer") {
      setCustomerForm({
        ...customerForm,
        ...item,
        id: item.id,
      });
    }
    setCommandOpen(false);
  }

  async function registerSelectedPayment(method = payment, value = splitAmount) {
    const amount = value ? parsePaymentAmount(value) : Number(cartSummary.remaining || cartSummary.total || 0);
    if (amount <= 0) return;
    const installments = ["Cartao credito", "Crediario"].includes(method) ? Math.max(Number(paymentInstallments || 1), 1) : 1;
    setPayment(method);
    let providerData = {};
    if (method === "Pix" && openPixReady) {
      setPixLoading(true);
      setPixError("");
      try {
        const charge = await createOpenPixCharge({
          amount,
          correlationID: `pdv-${Date.now()}`,
          comment: `Venda PDV ${tenant?.name || "Nexo.io"}`,
          customer: {
            name: customerForm.name,
            phone: customerForm.phone,
            document: customerForm.document,
          },
        });
        setPixCharge(charge);
        providerData = {
          provider: "OpenPix",
          status: charge.paid ? "Confirmado" : "Aguardando confirmação",
          correlationID: charge.correlationID,
          brCode: charge.brCode || "",
          qrCodeImage: charge.qrCodeImage || "",
          paymentLinkUrl: charge.paymentLinkUrl || "",
        };
      } catch (error) {
        setPixError(error.message || "Não foi possível gerar o Pix OpenPix.");
        return;
      } finally {
        setPixLoading(false);
      }
    }
    setPayments((current) => [...current, {
      method,
      amount,
      installments,
      dueDate: method === "Crediario" ? crediarioDueDate : "",
      provider: method === "Pix" && openPixReady ? "OpenPix" : "",
      status: method === "Pix" && openPixReady ? "Aguardando confirmação" : "Registrado",
      ...providerData,
    }]);
    setSplitAmount("");
    setPaymentInstallments("1");
    setCrediarioDueDate("");
    setPaymentModal(null);
  }

  async function refreshOpenPixPayment(index, paymentItem) {
    if (!paymentItem?.correlationID) return;
    setPixLoading(true);
    setPixError("");
    try {
      const result = await checkOpenPixCharge(paymentItem.correlationID);
      setPayments((current) => current.map((item, itemIndex) => itemIndex === index ? {
        ...item,
        status: result.paid ? "Confirmado" : result.status || "Aguardando confirmação",
        paidAt: result.paidAt || item.paidAt || "",
        transactionID: result.transactionID || item.transactionID || "",
      } : item));
    } catch (error) {
      setPixError(error.message || "Não foi possível consultar a OpenPix.");
    } finally {
      setPixLoading(false);
    }
  }

  async function submitCashMovement(event) {
    event.preventDefault();
    if (!cashMovementModal) return;
    const amount = parsePaymentAmount(cashMovementForm.amount);
    if (amount <= 0) return;
    const payload = await addCashMovement(cashMovementModal.type, amount, cashMovementForm.note);
    if (!payload) return;
    setCashReceipt({
      kind: cashMovementModal.type === "supply" ? "Suprimento" : "Sangria",
      operator: operatorName,
      amount,
      note: cashMovementForm.note || "Sem observação",
      date: new Date().toLocaleString("pt-BR"),
    });
    setCashMovementForm({ amount: "", note: "" });
    setCashMovementModal(null);
  }

  async function submitCashClose(event) {
    event.preventDefault();
    const countedAmount = parsePaymentAmount(cashCloseForm.countedAmount);
    const expectedAmount = Number(cashSummary?.expectedCash || 0);
    const ok = await closeCashRegister({
      countedAmount,
      expectedAmount,
      note: cashCloseForm.note,
      summary: cashSummary,
    });
    if (!ok) return;
    setCashReceipt({
      kind: "Fechamento de caixa",
      operator: operatorName,
      amount: countedAmount,
      expectedAmount,
      difference: countedAmount - expectedAmount,
      note: cashCloseForm.note || "Sem observação",
      summary: cashSummary,
      date: new Date().toLocaleString("pt-BR"),
    });
    setCashCloseForm({ countedAmount: "", note: "" });
    setCashCloseModal(false);
  }

  return (
    <div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(520px,0.98fr)]">
        <section className="space-y-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <UsersRound className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-blue-600">Cliente</h2>
            </div>
            <div className="grid gap-2 p-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
              <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="truncate text-sm font-black text-slate-900">{customerForm.name || "Cliente balcão"}</p>
                <p className="truncate text-xs font-semibold text-slate-500">
                  {customerForm.phone || "Sem telefone"} · {customerForm.document || "Sem CPF/CNPJ"}
                </p>
              </div>
              <button type="button" onClick={() => openSearch("customer")} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 text-xs font-black text-blue-700 hover:bg-blue-50">
                <UsersRound className="h-4 w-4" /> Buscar cliente
              </button>
              <button type="button" onClick={() => setCustomerModalOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
                <UserRoundPlus className="h-4 w-4" /> Novo cliente
              </button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-4">
            <ModeButton label="Produto" hotkey="Ctrl+P" active={commandMode === "product"} onClick={() => openSearch("product")} />
            <ModeButton label="Serviço" hotkey="Ctrl+S" active={commandMode === "service"} onClick={() => openSearch("service")} />
            <ModeButton label="Cliente" hotkey="Ctrl+C" active={commandMode === "customer"} onClick={() => openSearch("customer")} />
            <ModeButton label="Vale" hotkey="Ctrl+V" active={commandMode === "voucher"} onClick={() => openSearch("voucher")} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {searchMode === "product" && <div className="flex gap-2 overflow-x-auto pb-3">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-black ${
                    category === item
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>}

            {searchMode === "product" && (
              <div className="mb-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_48px]">
                <label className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-500 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                  <Search className="h-4 w-4" />
                  <input
                    value={productFilter}
                    onChange={(event) => setProductFilter(event.target.value)}
                    placeholder="Buscar por SKU, nome, modelo ou categoria..."
                    className="min-w-0 flex-1 bg-transparent outline-none"
                  />
                </label>
                <button type="button" onClick={() => openSearch("product")} className="grid h-11 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700">
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            )}

            {searchMode === "product" && <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={() => addProductToCart(product)} />
              ))}
              {!visibleProducts.length && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500 md:col-span-2">
                  Nenhum produto encontrado.
                </div>
              )}
            </div>}

            {searchMode === "service" && <div className="mt-4 grid max-h-[390px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
              {visibleServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => addServiceToCart(service)}
                  className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50"
                >
                  <p className="font-black text-slate-800">{service.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{service.duration} - {service.sector}</p>
                  <p className="mt-3 text-xl font-black text-[#08275c]">{formatMoney(service.price)}</p>
                </button>
              ))}
              {!visibleServices.length && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500 md:col-span-2">
                  Nenhum serviço encontrado.
                </div>
              )}
            </div>}

            {searchMode === "voucher" && <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                <Field label="Nome do vale" value={voucherName} onChange={setVoucherName} placeholder="Vale presente, crédito cliente..." />
                <Field label="Valor" value={voucherAmount} onChange={setVoucherAmount} mask={maskCurrency} placeholder="0,00" />
                <button
                  type="button"
                  onClick={() => {
                    const amount = parsePaymentAmount(voucherAmount);
                    if (amount <= 0) return;
                    addVoucherToCart({ name: voucherName, amount });
                    setVoucherAmount("");
                  }}
                  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white"
                >
                  Adicionar vale
                </button>
              </div>
              <p className="mt-3 text-sm font-semibold text-blue-800">Use para vender vale-presente ou registrar crédito pré-pago no carrinho.</p>
            </div>}

            {searchMode === "product" && <button type="button" className="mt-3 w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50">
              Ver mais produtos
            </button>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs font-black uppercase tracking-wide text-blue-600">Serviços rápidos</h2>
            </div>
            <div className="grid gap-2 md:grid-cols-5">
              {services.slice(0, 4).map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => addServiceToCart(service)}
                  className="min-h-14 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50"
                >
                  <p className="truncate text-xs font-black text-slate-800">{service.name}</p>
                  <p className="mt-1 text-xs font-black text-blue-600">{formatMoney(service.price)}</p>
                </button>
              ))}
              <button type="button" onClick={() => setActiveTab?.("servicos")} className="min-h-14 rounded-lg border border-dashed border-blue-300 bg-blue-50/30 px-3 py-2 text-xs font-black text-blue-600">
                <Plus className="mx-auto mb-1 h-4 w-4" /> Novo serviço
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-black uppercase tracking-wide text-blue-600">Carrinho</h2>
              </div>
              <div className="flex items-center gap-4 text-sm font-black text-blue-600">
                <button type="button" onClick={clearCart} className="inline-flex items-center gap-1 hover:text-blue-800"><Trash2 className="h-4 w-4" /> Limpar</button>
                <span className="h-5 w-px bg-slate-200" />
                <button type="button" className="inline-flex items-center gap-1 hover:text-blue-800"><Percent className="h-4 w-4" /> Descontos</button>
              </div>
            </div>

            {erro && <div className="px-4 pt-4"><Notice tone="danger">{erro}</Notice></div>}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">Item</th>
                    <th className="px-3 py-3 text-center font-black">Qtd</th>
                    <th className="px-3 py-3 text-right font-black">Preco</th>
                    <th className="px-3 py-3 text-right font-black">Total</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.map((item, index) => (
                    <tr key={`${item.kind}-${item.id}-${index}`} className="align-middle">
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <span className="font-black text-slate-700">{index + 1}.</span>
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-800">{item.name}</p>
                            <p className="truncate text-xs font-bold uppercase text-slate-400">{item.kind === "product" ? item.sku : "SERVIÇO"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="mx-auto grid w-24 grid-cols-3 overflow-hidden rounded-lg border border-slate-200">
                          <button type="button" onClick={() => updateCartQuantity(index, -1)} className="bg-white py-1 font-black hover:bg-slate-50">-</button>
                          <span className="border-x border-slate-200 py-1 text-center font-black">{item.quantity}</span>
                          <button type="button" onClick={() => updateCartQuantity(index, 1)} className="bg-white py-1 font-black hover:bg-slate-50">+</button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-700">{formatMoney(item.price)}</td>
                      <td className="px-3 py-3 text-right font-black text-slate-900">{formatMoney(item.price * item.quantity)}</td>
                      <td className="px-3 py-3 text-right">
                        <button type="button" onClick={() => updateCartQuantity(index, -item.quantity)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {!cart.length && (
                    <tr>
                      <td colSpan="5" className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                        Adicione produtos ou serviços para fechar a venda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-[1fr_0.95fr]">
              <div className="flex gap-2">
                <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} className="h-11 flex-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Cupom de desconto" />
                <button type="button" onClick={applyCoupon} className="rounded-lg border border-slate-200 px-4 text-sm font-black text-blue-600 hover:bg-blue-50">Aplicar</button>
              </div>
              <Field label="Desconto (R$)" value={discount} onChange={setDiscount} mask={maskCurrency} alignRight />
            </div>

            <div className="space-y-2 px-4 pb-4">
              <SummaryLine label="Subtotal" value={formatMoney(cartSummary.subtotal)} />
              <SummaryLine label="Desconto" value={formatMoney(cartSummary.discountValue)} />
              <div className="flex items-end justify-between pt-1">
                <span className="text-base font-black text-slate-900">Total</span>
                <span className="text-4xl font-black tracking-tight text-[#08275c]">{formatMoney(cartSummary.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-black uppercase tracking-wide text-blue-600">Pagamento</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {paymentOptions.map((option) => (
                <PaymentButton
                  key={option.id}
                  option={option}
                  active={payment === option.id}
                  onClick={() => {
                    setPayment(option.id);
                    setSplitAmount((cartSummary.remaining || cartSummary.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                    setPaymentModal(option);
                  }}
                />
              ))}
            </div>
            <div className="mt-4 grid gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-slate-700">Pagamentos adicionados</p>
                  <p className={`text-sm font-black ${cartSummary.remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {cartSummary.remaining > 0 ? `Falta ${formatMoney(cartSummary.remaining)}` : `Pago ${formatMoney(cartSummary.amountPaid)}`}
                  </p>
                </div>
                <div className="mt-2 grid gap-2">
                  {payments.map((item, index) => (
                    <div key={`${item.method}-${index}`} className="grid gap-2 rounded-lg bg-white px-3 py-2 text-sm sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                      <span className="font-bold text-slate-700">
                        {paymentLabel(item)}
                        {item.status && <span className="ml-2 text-xs font-black text-slate-400">{item.status}</span>}
                      </span>
                      <span className="font-black text-slate-900">{formatMoney(item.amount)}</span>
                      {item.provider === "OpenPix" && item.status !== "Confirmado" && (
                        <button type="button" disabled={pixLoading} onClick={() => refreshOpenPixPayment(index, item)} className="rounded-lg border border-blue-200 px-2 py-1 text-xs font-black text-blue-700 disabled:opacity-50">
                          Consultar Pix
                        </button>
                      )}
                      <button type="button" onClick={() => setPayments((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {!payments.length && <p className="text-sm font-semibold text-slate-400">Clique em uma forma para adicionar pagamento.</p>}
                </div>
              </div>
            </div>
            <div className="mt-4 grid items-end gap-4 md:grid-cols-[1fr_340px]">
              <div className="grid gap-1">
                <p className="text-sm font-black text-emerald-600">Troco / crédito</p>
                <p className="text-2xl font-black text-emerald-600">{formatMoney(cartSummary.change)}</p>
                {cartSummary.change > 0 && customerForm.name && (
                  <label className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-600">
                    <input type="checkbox" checked={creditSurplus} onChange={(event) => setCreditSurplus(event.target.checked)} />
                    Gerar crédito para o cliente
                  </label>
                )}
              </div>
              <button
                type="button"
                disabled={saving || !cart.length || cartSummary.remaining > 0 || pendingOpenPix}
                onClick={() => finishSale("Finalizado")}
                className="h-14 rounded-lg bg-emerald-600 px-6 text-base font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                {pendingOpenPix ? "AGUARDANDO PIX" : cartSummary.remaining > 0 ? `FALTA ${formatMoney(cartSummary.remaining)}` : "FINALIZAR VENDA"} <span className="ml-3 rounded-md bg-emerald-700 px-2 py-1 text-xs">F9</span>
              </button>
            </div>
            {/* legacy simple payment removed */}
            <div className="hidden">
              {paymentOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPayment(option.id)}
                  className={`rounded-lg border px-3 py-4 text-sm font-black transition ${
                    payment === option.id
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-inner"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-3 border-t border-white/10 bg-[#061c43] px-4 py-4 text-white shadow-2xl shadow-slate-950/20">
        <div className="grid gap-4 text-sm md:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]">
          <FooterMetric label="Caixa atual" value="Caixa 01" />
          <FooterMetric label="Abertura" value={openCashSession ? "Caixa aberto" : "Fechado"} />
          <FooterMetric label="Operador" value="Dono/Admin" />
          <FooterMetric label="Vendas do dia" value={formatMoney(metrics.revenueToday)} />
          <FooterMetric label="Ticket medio" value={formatMoney(metrics.averageTicket)} />
          <FooterMetric label="Itens vendidos" value={metrics.itemsSoldToday || 0} />
          <div className="flex items-center gap-2">
            {!openCashSession ? (
              <>
                <input value={cashAmount} onChange={(event) => setCashAmount(maskCurrency(event.target.value))} className="h-10 w-28 rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-bold outline-none" placeholder="0,00" />
                <button type="button" onClick={() => openCashRegister(Number(cashAmount.replace(/\./g, "").replace(",", ".")))} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-black text-white"><Power className="h-4 w-4" /> ABRIR</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setCashHistoryOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-white/10 px-3 text-xs font-black text-white hover:bg-white/15">
                  <History className="h-4 w-4" /> Histórico
                </button>
                <button
                  type="button"
                  disabled={!canManageCash}
                  onClick={() => {
                    setCashMovementModal({ type: "supply", title: "Registrar suprimento" });
                    setCashMovementForm({ amount: "", note: "" });
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-500/20 px-3 text-xs font-black text-emerald-100 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <TrendingUp className="h-4 w-4" /> Suprimento
                </button>
                <button
                  type="button"
                  disabled={!canManageCash}
                  onClick={() => {
                    setCashMovementModal({ type: "withdrawal", title: "Registrar sangria" });
                    setCashMovementForm({ amount: "", note: "" });
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500/20 px-3 text-xs font-black text-amber-100 hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <TrendingDown className="h-4 w-4" /> Sangria
                </button>
                <button
                  type="button"
                  disabled={!canManageCash}
                  onClick={() => {
                    setCashCloseForm({
                      countedAmount: Number(cashSummary?.expectedCash || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                      note: "",
                    });
                    setCashCloseModal(true);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-500/25 px-4 text-xs font-black text-red-100 hover:bg-red-500/35 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ClipboardCheck className="h-4 w-4" /> Fechar caixa
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      <Modal title={`Buscar ${commandMode === "product" ? "produto" : commandMode === "service" ? "serviço" : commandMode === "customer" ? "cliente" : "vale"}`} open={commandOpen} onClose={() => setCommandOpen(false)}>
        <div className="grid gap-4">
          <div className="grid gap-2 md:grid-cols-4">
            <ModeButton label="Produto" hotkey="Ctrl+P" active={commandMode === "product"} onClick={() => openSearch("product")} />
            <ModeButton label="Serviço" hotkey="Ctrl+S" active={commandMode === "service"} onClick={() => openSearch("service")} />
            <ModeButton label="Cliente" hotkey="Ctrl+C" active={commandMode === "customer"} onClick={() => openSearch("customer")} />
            <ModeButton label="Vale" hotkey="Ctrl+V" active={commandMode === "voucher"} onClick={() => openSearch("voucher")} />
          </div>

          {commandMode !== "voucher" && (
            <>
              <Field
                label="Buscar"
                value={commandQuery}
                onChange={setCommandQuery}
                placeholder={commandMode === "product" ? "Digite nome, SKU, modelo ou categoria" : commandMode === "service" ? "Digite o serviço técnico" : "Digite nome, telefone, CPF/CNPJ ou aparelho"}
              />
              <div className="grid max-h-[420px] gap-2 overflow-y-auto">
                {commandResults.map((item) => (
                  <button
                    key={`${commandMode}-${item.id}`}
                    type="button"
                    onClick={() => chooseCommandResult(item)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">{item.name}</p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {commandMode === "product" && `${item.sku || "Sem SKU"} · ${item.category || "Produto"} · ${item.stock || 0} un`}
                        {commandMode === "service" && `${item.duration || ""} · ${item.sector || "Serviço"}`}
                        {commandMode === "customer" && `${item.phone || "Sem telefone"} · ${item.document || "Sem documento"}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-blue-700">
                      {commandMode === "customer" ? "Selecionar" : formatMoney(item.price)}
                    </span>
                  </button>
                ))}
                {!commandResults.length && <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm font-bold text-slate-500">Nada encontrado.</p>}
              </div>
            </>
          )}

          {commandMode === "voucher" && (
            <div className="grid gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 md:grid-cols-[1fr_180px_auto]">
              <Field label="Nome do vale" value={voucherName} onChange={setVoucherName} placeholder="Vale presente, crédito cliente..." />
              <Field label="Valor" value={voucherAmount} onChange={setVoucherAmount} mask={maskCurrency} placeholder="0,00" />
              <button
                type="button"
                onClick={() => {
                  const amount = parsePaymentAmount(voucherAmount);
                  if (amount <= 0) return;
                  addVoucherToCart({ name: voucherName, amount });
                  setVoucherAmount("");
                  setCommandOpen(false);
                }}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white"
              >
                Adicionar vale
              </button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="Novo cliente"
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        footer={
          <div className="flex justify-end">
            <button type="button" onClick={(event) => { handleCustomerSubmit(event); setCustomerModalOpen(false); }} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white">
              Salvar cliente
            </button>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome" value={customerForm.name} onChange={(value) => setCustomerForm({ ...customerForm, name: value })} error={errors.customerName} />
          <Field label="WhatsApp" value={customerForm.phone} onChange={(value) => setCustomerForm({ ...customerForm, phone: value })} mask={maskPhone} />
          <Field label="CPF/CNPJ" value={customerForm.document} onChange={(value) => setCustomerForm({ ...customerForm, document: value })} mask={maskCpfCnpj} error={errors.customerDocument} />
          <Field label="CEP" value={customerForm.cep} onChange={(value) => setCustomerForm({ ...customerForm, cep: value })} />
          <Field label="Rua" value={customerForm.street} onChange={(value) => setCustomerForm({ ...customerForm, street: value })} />
          <Field label="Numero" value={customerForm.number} onChange={(value) => setCustomerForm({ ...customerForm, number: value })} />
          <Field label="Bairro" value={customerForm.neighborhood} onChange={(value) => setCustomerForm({ ...customerForm, neighborhood: value })} />
          <Field label="Cidade" value={customerForm.city} onChange={(value) => setCustomerForm({ ...customerForm, city: value })} />
          <Field label="UF" value={customerForm.state} onChange={(value) => setCustomerForm({ ...customerForm, state: value.toUpperCase().slice(0, 2) })} />
          <Field label="Aparelho" value={customerForm.device} onChange={(value) => setCustomerForm({ ...customerForm, device: value })} />
        </div>
      </Modal>

      <Modal title="Comprovante de venda" open={Boolean(lastReceipt)} onClose={() => setLastReceipt(null)}>
        {lastReceipt && (
          <div className="mx-auto max-w-sm rounded-lg border border-slate-200 bg-white p-5 font-mono text-sm text-slate-900">
            <p className="text-center text-lg font-black">{lastReceipt.tenant}</p>
            <p className="text-center text-xs">{lastReceipt.date}</p>
            <p className="mt-3 border-t border-slate-200 pt-3">Cliente: {lastReceipt.customer}</p>
            <div className="mt-3 space-y-2">
              {lastReceipt.items.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="flex justify-between gap-3">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatMoney(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3">
              <SummaryLine label="Subtotal" value={formatMoney(lastReceipt.subtotal)} />
              <SummaryLine label="Desconto" value={formatMoney(lastReceipt.discount)} />
              <SummaryLine label="Total" value={formatMoney(lastReceipt.total)} />
              <SummaryLine label="Pagamento" value={lastReceipt.payment} />
              {(lastReceipt.payments || []).map((item, index) => (
                <SummaryLine key={`${item.method}-${index}`} label={paymentLabel(item)} value={formatMoney(item.amount)} />
              ))}
              <SummaryLine label="Recebido" value={formatMoney(lastReceipt.received)} />
              <SummaryLine label="Troco" value={formatMoney(lastReceipt.change)} />
              {lastReceipt.creditGenerated > 0 && <SummaryLine label="Crédito gerado" value={formatMoney(lastReceipt.creditGenerated)} />}
            </div>
            <button type="button" onClick={() => printSaleReceiptDocument({ sale: lastReceipt, store: tenant, title: "Comprovante de venda" })} className="mt-4 w-full rounded-lg bg-slate-950 px-4 py-3 font-sans text-sm font-black text-white">
              Imprimir / PDF
            </button>
          </div>
        )}
      </Modal>

      <Modal title={`Pagamento - ${paymentModal?.label || ""}`} open={Boolean(paymentModal)} onClose={() => setPaymentModal(null)}>
        {paymentModal && (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              registerSelectedPayment(paymentModal.id, splitAmount);
            }}
          >
            <Field
              label="Valor do pagamento"
              value={splitAmount}
              onChange={setSplitAmount}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  registerSelectedPayment(paymentModal.id, splitAmount);
                }
              }}
              mask={maskCurrency}
              placeholder={cartSummary.remaining ? formatMoney(cartSummary.remaining) : "0,00"}
            />
            {paymentModal.id === "Pix" && (
              <div className={`rounded-lg border p-3 text-sm font-semibold ${openPixReady ? "border-blue-200 bg-blue-50 text-blue-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                {openPixReady
                  ? "OpenPix ativo: ao registrar, o sistema gera QR Code dinâmico e bloqueia a finalização até confirmar o pagamento."
                  : "OpenPix não configurado: o Pix será registrado de forma manual no caixa."}
              </div>
            )}
            {pixCharge && paymentModal.id === "Pix" && (
              <div className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-950">
                <p className="font-black">Cobrança OpenPix gerada</p>
                {pixCharge.qrCodeImage && <img src={pixCharge.qrCodeImage} alt="QR Code Pix" className="mx-auto h-44 w-44 rounded-lg bg-white p-2" />}
                {pixCharge.brCode && <textarea readOnly value={pixCharge.brCode} className="min-h-20 rounded-lg border border-emerald-200 bg-white p-2 text-xs" />}
                <p>Status: {pixCharge.status || "Aguardando confirmação"}</p>
              </div>
            )}
            {pixError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                {pixError}
              </div>
            )}
            {["Cartao credito", "Crediario"].includes(paymentModal.id) && (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Parcelas</span>
                  <select
                    value={paymentInstallments}
                    onChange={(event) => setPaymentInstallments(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((installment) => (
                      <option key={installment} value={installment}>{installment}x de {formatMoney(parsePaymentAmount(splitAmount) / installment)}</option>
                    ))}
                  </select>
                </label>
                {paymentModal.id === "Crediario" && (
                  <label className="block min-w-0">
                    <span className="mb-2 block text-sm font-bold text-slate-700">Primeiro vencimento</span>
                    <input
                      type="date"
                      value={crediarioDueDate}
                      onChange={(event) => setCrediarioDueDate(event.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                )}
              </div>
            )}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <SummaryLine label="Total da venda" value={formatMoney(cartSummary.total)} />
              <SummaryLine label="Já pago" value={formatMoney(cartSummary.amountPaid)} />
              <SummaryLine label="Falta" value={formatMoney(cartSummary.remaining)} />
            </div>
            <button type="submit" disabled={pixLoading} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              {pixLoading ? "Gerando/consultando..." : "Registrar pagamento"}
            </button>
          </form>
        )}
      </Modal>

      <Modal title={cashMovementModal?.title || "Movimentação de caixa"} open={Boolean(cashMovementModal)} onClose={() => setCashMovementModal(null)}>
        {cashMovementModal && (
          <form className="grid gap-4" onSubmit={submitCashMovement}>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Valor" value={cashMovementForm.amount} onChange={(value) => setCashMovementForm({ ...cashMovementForm, amount: value })} mask={maskCurrency} placeholder="0,00" />
              <Field label="Operador" value={operatorName || ""} onChange={() => {}} placeholder="Operador" />
            </div>
            <label className="text-sm font-bold text-slate-700">
              Motivo / observação
              <textarea
                value={cashMovementForm.note}
                onChange={(event) => setCashMovementForm({ ...cashMovementForm, note: event.target.value })}
                className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder={cashMovementModal.type === "supply" ? "Ex: Reforço de troco" : "Ex: Retirada para depósito"}
              />
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-600">
              Confirme a operacao. Ela ficara registrada no caixa atual.
            </div>
            <button type="submit" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white">
              Confirmar {cashMovementModal.type === "supply" ? "suprimento" : "sangria"}
            </button>
          </form>
        )}
      </Modal>

      <Modal title="Fechamento de caixa" open={cashCloseModal} onClose={() => setCashCloseModal(false)}>
        <form className="grid gap-4" onSubmit={submitCashClose}>
          <div className="grid gap-3 md:grid-cols-2">
            <SummaryCard label="Saldo inicial" value={formatMoney(cashSummary?.openingAmount)} />
            <SummaryCard label="Vendas em dinheiro" value={formatMoney(cashSummary?.cashSales)} />
            <SummaryCard label="PIX" value={formatMoney(cashSummary?.pixSales)} />
            <SummaryCard label="Cartões" value={formatMoney(cashSummary?.cardSales)} />
            <SummaryCard label="Suprimentos" value={formatMoney(cashSummary?.supplies)} />
            <SummaryCard label="Sangrias" value={formatMoney(cashSummary?.withdrawals)} />
            <SummaryCard label="Trocos pagos" value={formatMoney(cashSummary?.changePaid)} />
            <SummaryCard label="Saldo esperado" value={formatMoney(cashSummary?.expectedCash)} strong />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Valor contado em dinheiro" value={cashCloseForm.countedAmount} onChange={(value) => setCashCloseForm({ ...cashCloseForm, countedAmount: value })} mask={maskCurrency} placeholder="0,00" />
            <SummaryCard label="Diferença / sobra / falta" value={formatMoney(parsePaymentAmount(cashCloseForm.countedAmount) - Number(cashSummary?.expectedCash || 0))} strong />
          </div>
          <label className="text-sm font-bold text-slate-700">
            Observação de fechamento
            <textarea
              value={cashCloseForm.note}
              onChange={(event) => setCashCloseForm({ ...cashCloseForm, note: event.target.value })}
              className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Informe divergencias, conferencias ou observacoes."
            />
          </label>
          <button type="submit" className="rounded-lg bg-red-600 px-5 py-3 text-sm font-black text-white">
            Confirmar fechamento
          </button>
        </form>
      </Modal>

      <Modal title="Histórico do caixa atual" open={cashHistoryOpen} onClose={() => setCashHistoryOpen(false)}>
        <div className="grid gap-3">
          {(cashSummary?.movements || cashMovements || []).filter((movement) => !openCashSession || movement.cashSessionId === openCashSession.id).map((movement) => (
            <div key={movement.id || `${movement.type}-${movement.amount}-${movement.note}`} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900">{movement.type === "supply" ? "Suprimento" : "Sangria"}</p>
                  <p className="text-sm font-semibold text-slate-500">{movement.note || "Sem observação"}</p>
                  <p className="text-xs font-semibold text-slate-400">{movement.operatorEmail || operatorName}</p>
                </div>
                <p className={`font-black ${movement.type === "supply" ? "text-emerald-600" : "text-red-600"}`}>{formatMoney(movement.amount)}</p>
              </div>
            </div>
          ))}
          {!(cashSummary?.movements || []).length && <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm font-bold text-slate-500">Nenhuma movimentação registrada neste caixa.</p>}
        </div>
      </Modal>

      <Modal title="Comprovante de caixa" open={Boolean(cashReceipt)} onClose={() => setCashReceipt(null)}>
        {cashReceipt && (
          <div className="mx-auto max-w-sm rounded-lg border border-slate-200 bg-white p-5 font-mono text-sm text-slate-900">
            <p className="text-center text-lg font-black">{cashReceipt.kind}</p>
            <p className="text-center text-xs">{cashReceipt.date}</p>
            <div className="mt-3 border-t border-slate-200 pt-3">
              <SummaryLine label="Operador" value={cashReceipt.operator} />
              <SummaryLine label="Valor" value={formatMoney(cashReceipt.amount)} />
              {cashReceipt.expectedAmount !== undefined && <SummaryLine label="Esperado" value={formatMoney(cashReceipt.expectedAmount)} />}
              {cashReceipt.difference !== undefined && <SummaryLine label="Diferença" value={formatMoney(cashReceipt.difference)} />}
              <SummaryLine label="Observação" value={cashReceipt.note} />
            </div>
            {cashReceipt.summary && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                <SummaryLine label="Dinheiro" value={formatMoney(cashReceipt.summary.cashSales)} />
                <SummaryLine label="Suprimentos" value={formatMoney(cashReceipt.summary.supplies)} />
                <SummaryLine label="Sangrias" value={formatMoney(cashReceipt.summary.withdrawals)} />
                <SummaryLine label="Trocos" value={formatMoney(cashReceipt.summary.changePaid)} />
              </div>
            )}
            <button type="button" onClick={() => printCashReceipt(cashReceipt, tenant)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 font-sans text-sm font-black text-white">
              <Printer className="h-4 w-4" /> Imprimir comprovante
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, placeholder = "", error = "", mask, alignRight = false, onKeyDown }) {
  function handleChange(event) {
    onChange(mask ? mask(event.target.value) : event.target.value);
  }

  return (
    <label className="block min-w-0">
      <span className="sr-only">{label}</span>
      <input
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder || label}
        className={`h-11 w-full rounded-lg border px-3 text-sm font-semibold outline-none focus:ring-4 ${
          alignRight ? "text-right" : ""
        } ${error ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}
      />
      {error && <span className="mt-1 block text-xs font-bold text-red-600">{error}</span>}
    </label>
  );
}

function parsePaymentAmount(value) {
  const normalized = String(value || "").replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function paymentLabel(payment) {
  const labels = {
    "Cartao credito": "Cartão Crédito",
    "Cartao debito": "Cartão Débito",
    "Vale/Credito": "Vale/Crédito",
    Crediario: "Crediário",
    Pix: "PIX",
  };
  const base = labels[payment.method] || payment.method;
  const installments = Number(payment.installments || 1) > 1 ? ` em ${payment.installments}x` : "";
  const provider = payment.provider ? ` - ${payment.provider}` : "";
  const dueDate = payment.dueDate ? ` - venc. ${new Date(`${payment.dueDate}T00:00:00`).toLocaleDateString("pt-BR")}` : "";
  return `${base}${installments}${provider}${dueDate}`;
}

function PaymentButton({ option, active, onClick }) {
  const Icon = option.Icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-4 text-sm font-black transition ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-inner"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {option.label}
    </button>
  );
}

function ModeButton({ label, hotkey, active = false, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`h-10 rounded-lg border px-3 text-xs font-black shadow-sm ${active ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
      {label} <span className="text-xs text-slate-400">({hotkey})</span>
    </button>
  );
}

function ProductCard({ product, onAdd }) {
  const low = Number(product.stock || 0) <= Number(product.minStock || 0);
  const imageUrl = productImageFor(product);

  return (
    <div onClick={onAdd} className="relative min-h-[116px] cursor-pointer rounded-lg border border-slate-200 bg-white py-3 pl-[96px] pr-3 shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <div className="absolute left-3 top-3 grid h-[88px] w-[76px] place-items-center overflow-hidden rounded-lg bg-slate-50">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="h-full w-full object-contain p-1" />
        ) : (
          <span className="px-2 text-center text-[10px] font-black uppercase leading-3 text-slate-400">Sem imagem</span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black text-slate-800">{product.name}</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-500">{product.sku} • {product.category}</p>
        </div>
        <Badge tone={low ? "danger" : "success"}>{product.stock} un</Badge>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="grid w-24 grid-cols-3 overflow-hidden rounded-lg border border-slate-200">
          <button type="button" className="bg-white py-1 font-black text-slate-500">-</button>
          <span className="border-x border-slate-200 py-1 text-center font-black text-slate-700">1</span>
          <button type="button" onClick={(event) => { event.stopPropagation(); onAdd(); }} className="bg-white py-1 font-black text-slate-700 hover:bg-blue-50">+</button>
        </div>
        <button type="button" onClick={(event) => { event.stopPropagation(); onAdd(); }} className="text-xl font-black text-[#08275c]">{formatMoney(product.price)}</button>
      </div>
    </div>
  );
}

function productImageFor(product) {
  if (product.imageUrl) return product.imageUrl;
  return "";
}

function SummaryLine({ label, value }) {
  return (
    <div className="flex items-center justify-between text-base">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className="font-black text-slate-900">{value}</span>
    </div>
  );
}

function SummaryCard({ label, value, strong = false }) {
  return (
    <div className={`rounded-lg border p-3 ${strong ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-black ${strong ? "text-blue-700" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function FooterMetric({ label, value }) {
  return (
    <div className="border-white/10 md:border-r md:pr-5">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-base font-black">{value}</p>
    </div>
  );
}

function receiptShell(title, body) {
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page{size:80mm auto;margin:4mm}
          *{box-sizing:border-box}
          body{margin:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;font-size:11px}
          .receipt{width:72mm;margin:0 auto}
          .logo{max-width:32mm;max-height:18mm;object-fit:contain;display:block;margin:0 auto 5px}
          h1{font-size:15px;margin:0;text-align:center}
          h2{font-size:12px;margin:4px 0 0;text-align:center;font-weight:700}
          .center{text-align:center}
          .muted{color:#555}
          .line{border-top:1px dashed #999;margin:8px 0}
          .row{display:flex;justify-content:space-between;gap:8px;margin:3px 0}
          .row strong{font-size:12px;text-align:right}
          .items{display:grid;gap:4px}
          .sign{margin-top:18px;border-top:1px solid #111;text-align:center;padding-top:4px}
        </style>
      </head>
      <body><div class="receipt">${body}</div><script>window.print();setTimeout(()=>window.close(),600);</script></body>
    </html>`;
}

function openReceiptWindow(html) {
  const printWindow = window.open("", "_blank", "width=420,height=720");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

// eslint-disable-next-line no-unused-vars
function printSaleReceipt(receipt, tenant) {
  if (!receipt) return;
  const paymentsHtml = (receipt.payments || []).map((item) => `
    <div class="row"><span>${paymentLabel(item)}</span><strong>${formatMoney(item.amount)}</strong></div>
    ${item.provider ? `<div class="row muted"><span>${item.provider}</span><span>${item.status || ""}</span></div>` : ""}
  `).join("");
  const itemsHtml = (receipt.items || []).map((item) => `
    <div>
      <div class="row"><span>${item.quantity}x ${item.name}</span><strong>${formatMoney(item.price * item.quantity)}</strong></div>
      <div class="muted">${item.sku || item.kind || ""}</div>
    </div>
  `).join("");
  openReceiptWindow(receiptShell("Comprovante de venda", `
    ${receiptStoreHeader(tenant, receipt.tenant)}
    <h2>Comprovante de venda</h2>
    <p class="center muted">${receipt.date}</p>
    <div class="line"></div>
    <div class="row"><span>Cliente</span><strong>${receipt.customer || "Cliente balcão"}</strong></div>
    <div class="items">${itemsHtml}</div>
    <div class="line"></div>
    <div class="row"><span>Subtotal</span><strong>${formatMoney(receipt.subtotal)}</strong></div>
    <div class="row"><span>Desconto</span><strong>${formatMoney(receipt.discount)}</strong></div>
    <div class="row"><span>Total</span><strong>${formatMoney(receipt.total)}</strong></div>
    ${paymentsHtml}
    <div class="row"><span>Troco</span><strong>${formatMoney(receipt.change)}</strong></div>
    <div class="line"></div>
    <p class="center">${tenant?.receiptMessage || "Obrigado pela preferência."}</p>
  `));
}

function printCashReceipt(receipt, tenant) {
  if (!receipt) return;
  openReceiptWindow(receiptShell("Comprovante de caixa", `
    ${receiptStoreHeader(tenant)}
    <h2>${receipt.kind}</h2>
    <p class="center muted">${receipt.date}</p>
    <div class="line"></div>
    <div class="row"><span>Operador</span><strong>${receipt.operator}</strong></div>
    <div class="row"><span>Valor</span><strong>${formatMoney(receipt.amount)}</strong></div>
    ${receipt.expectedAmount !== undefined ? `<div class="row"><span>Esperado</span><strong>${formatMoney(receipt.expectedAmount)}</strong></div>` : ""}
    ${receipt.difference !== undefined ? `<div class="row"><span>Diferença</span><strong>${formatMoney(receipt.difference)}</strong></div>` : ""}
    <div class="row"><span>Observação</span><strong>${receipt.note || "-"}</strong></div>
    ${receipt.summary ? `
      <div class="line"></div>
      <div class="row"><span>Dinheiro</span><strong>${formatMoney(receipt.summary.cashSales)}</strong></div>
      <div class="row"><span>PIX</span><strong>${formatMoney(receipt.summary.pixSales)}</strong></div>
      <div class="row"><span>Cartões</span><strong>${formatMoney(receipt.summary.cardSales)}</strong></div>
      <div class="row"><span>Suprimentos</span><strong>${formatMoney(receipt.summary.supplies)}</strong></div>
      <div class="row"><span>Sangrias</span><strong>${formatMoney(receipt.summary.withdrawals)}</strong></div>
    ` : ""}
    <div class="sign">Assinatura</div>
  `));
}

function receiptStoreHeader(tenant, fallbackName = "Nexo.io") {
  const storeName = tenant?.name || fallbackName || "Nexo.io";
  const contact = tenant?.whatsapp || tenant?.phone || "";
  const document = tenant?.document || "";
  const address = [tenant?.street, tenant?.number, tenant?.neighborhood, tenant?.city, tenant?.state].filter(Boolean).join(", ");
  return `
    ${tenant?.logoUrl ? `<img class="logo" src="${escapeHtml(tenant.logoUrl)}" alt="${escapeHtml(storeName)}" />` : ""}
    <h1>${escapeHtml(storeName)}</h1>
    ${document ? `<p class="center muted">${escapeHtml(document)}</p>` : ""}
    ${contact ? `<p class="center muted">WhatsApp/Telefone: ${escapeHtml(contact)}</p>` : ""}
    ${address ? `<p class="center muted">${escapeHtml(address)}</p>` : ""}
  `;
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
