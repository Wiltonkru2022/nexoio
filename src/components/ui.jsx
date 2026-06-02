import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Boxes,
  ChevronDown,
  Clock3,
  CreditCard,
  FileBarChart,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
  Wrench,
} from "lucide-react";
import { canAccess, roles } from "../lib/validation";

export function BrandLogo({ compact = false, className = "" }) {
  if (compact) {
    return (
      <div className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100 shadow-lg shadow-sky-500/20 ${className}`}>
        <img src="/brand/nexoio-mark.png" alt="Nexo.io" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <img
      src="/brand/nexoio-logo-cropped.png"
      alt="Nexo.io"
      className={`block h-auto max-h-14 w-full max-w-[170px] object-contain ${className}`}
    />
  );
}

export function AppShell({
  activeTab,
  setActiveTab,
  user,
  profile,
  tenant,
  notifications = [],
  globalSearch = "",
  setGlobalSearch,
  globalResults = [],
  onGlobalResultClick,
  onLogout,
  children,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchInputRef = useRef(null);
  const userMenuRef = useRef(null);
  const now = new Date();
  const pages = [
    { id: "pdv", label: "PDV Caixa", Icon: Store, permission: "pdv" },
    { id: "produtos", label: "Produtos", Icon: Package, permission: "produtos" },
    { id: "servicos", label: "Serviços", Icon: Wrench, permission: "servicos" },
    { id: "clientes", label: "Clientes", Icon: Users, permission: "clientes" },
    { id: "vendas", label: "Vendas", Icon: ShoppingCart, permission: "vendas" },
    { id: "estoque", label: "Estoque", Icon: Boxes, permission: "estoque" },
    { id: "financeiro", label: "Financeiro", Icon: CreditCard, permission: "financeiro" },
    { id: "relatorios", label: "Relatórios", Icon: FileBarChart, permission: "relatorios" },
    { id: "configuracoes", label: "Configurações", Icon: Settings, permission: "configuracoes" },
  ].filter((page) => canAccess(profile?.role, page.permission));
  const extraTitles = {
    estoque: "Estoque",
    assistencia: "Assistência",
    financeiro: "Financeiro",
    backup: "Backup",
    integracoes: "Integrações",
    impressoes: "Impressões",
    cupons: "Cupons",
    metas: "Metas",
  };
  const pageTitle = pages.find((page) => page.id === activeTab)?.label || extraTitles[activeTab] || "PDV CAIXA";

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061c43] text-white shadow-lg shadow-slate-950/10">
        <div className="flex min-h-[78px] items-center gap-5 px-5">
          <button type="button" onClick={() => setActiveTab("modulos")} className="shrink-0" title="Nexo.io">
            {activeTab === "pdv" ? <BrandLogo compact /> : <BrandLogo className="brightness-0 invert" />}
          </button>
          {activeTab === "pdv" && (
            <button
              type="button"
              onClick={() => setActiveTab("modulos")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-black text-white hover:bg-white/15"
            >
              ← Voltar
            </button>
          )}
          {activeTab !== "pdv" && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-blue-200 hover:bg-white/10 md:flex"
              title={sidebarCollapsed ? "Abrir menu" : "Fechar menu"}
            >
              <Menu size={22} />
            </button>
          )}
          <div className="min-w-[190px]">
            <h1 className="text-lg font-black tracking-tight">{activeTab === "pdv" ? "PDV CAIXA" : pageTitle}</h1>
            <p className="text-sm font-semibold text-slate-300">{tenant?.name || "Minha loja de eletrônicos"}</p>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[520px] items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-slate-200 shadow-inner lg:flex">
            <Search size={18} />
            <input
              ref={searchInputRef}
              value={globalSearch}
              onChange={(event) => {
                setGlobalSearch?.(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white placeholder:text-slate-300 outline-none"
              placeholder="Buscar produto, serviço ou cliente"
            />
            <kbd className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-black text-white">Ctrl + K</kbd>
            {searchOpen && globalSearch.trim() && (
              <div className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-2xl">
                <div className="max-h-80 overflow-y-auto p-2">
                  {globalResults.length ? globalResults.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => {
                        onGlobalResultClick?.(item);
                        setSearchOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{item.title}</p>
                        <p className="truncate text-xs font-semibold text-slate-500">{item.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{item.label}</span>
                    </button>
                  )) : (
                    <p className="p-4 text-center text-sm font-bold text-slate-500">Nenhum resultado encontrado.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="ml-auto hidden items-center gap-4 md:flex">
            <div className="flex items-center gap-2 text-right text-sm">
              <Clock3 size={21} className="text-slate-300" />
              <div>
                <p className="font-black">{now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                <p className="text-slate-300">{now.toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
            <div className="relative">
              <button type="button" onClick={() => setNotificationsOpen((current) => !current)} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/15">
                <Bell size={21} />
                {notifications.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{notifications.length}</span>}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <p className="font-black">Notificações</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{notifications.length}</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length ? notifications.map((item) => (
                      <button key={item.id} type="button" onClick={() => { if (item.tab) setActiveTab(item.tab); setNotificationsOpen(false); }} className="w-full rounded-lg px-3 py-3 text-left hover:bg-slate-50">
                        <p className="text-sm font-black">{item.title}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{item.description}</p>
                      </button>
                    )) : (
                      <div className="p-5 text-center">
                        <ShieldCheck className="mx-auto text-emerald-500" size={28} />
                        <p className="mt-2 text-sm font-black">Tudo em ordem</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((current) => !current)}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-white/10"
              >
                <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sky-300 to-slate-200">
                  {tenant?.logoUrl ? (
                    <img src={tenant.logoUrl} alt={tenant?.name || "Logo da loja"} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="hidden text-sm xl:block">
                  <p className="flex items-center gap-1 font-black">{roles[profile?.role] || "Carregando"} <ChevronDown size={14} /></p>
                  <p className="max-w-44 truncate text-slate-300">{user.email}</p>
                </div>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-2xl">
                  <div className="border-b border-slate-200 px-4 py-4">
                    <p className="text-sm font-black">{roles[profile?.role] || "Usuário"}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{user.email}</p>
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                      <p className="text-xs font-black uppercase text-blue-700">Plano atual</p>
                      <p className="text-sm font-black text-slate-950">{tenant?.plan || "starter"}</p>
                    </div>
                  </div>
                  <div className="grid gap-1 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("configuracoes");
                        setUserMenuOpen(false);
                      }}
                      className="inline-flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      <Settings size={17} /> Configurações
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("configuracoes");
                        setUserMenuOpen(false);
                      }}
                      className="inline-flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      <CreditCard size={17} /> Plano
                    </button>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="inline-flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-black text-red-700 hover:bg-red-50"
                    >
                      <LogOut size={17} /> Sair do sistema
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={activeTab === "pdv" ? "min-h-[calc(100vh-78px)]" : `grid min-h-[calc(100vh-78px)] ${sidebarCollapsed ? "lg:grid-cols-[76px_minmax(0,1fr)]" : "lg:grid-cols-[220px_minmax(0,1fr)]"}`}>
        <aside className={activeTab === "pdv" ? "hidden" : `sticky top-[78px] hidden h-[calc(100vh-78px)] overflow-y-auto border-r border-slate-900/10 bg-[#071b3a] p-4 text-white lg:flex lg:flex-col ${sidebarCollapsed ? "items-center" : ""}`}>
          <button
            type="button"
            onClick={() => setActiveTab("pdv")}
            className={`mb-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/20 ${sidebarCollapsed ? "h-12 w-12 px-0" : "w-full"}`}
            title="Abrir PDV"
          >
            <Store size={18} /> {!sidebarCollapsed && "Abrir PDV"}
          </button>
          <nav className={`grid gap-1 ${sidebarCollapsed ? "w-full" : ""}`}>
            <SidebarButton collapsed={sidebarCollapsed} active={activeTab === "modulos"} icon={Home} label="Início" onClick={() => setActiveTab("modulos")} />
            {pages.map((page) => (
              <SidebarButton key={page.id} collapsed={sidebarCollapsed} active={activeTab === page.id} icon={page.Icon} label={page.label} onClick={() => setActiveTab(page.id)} />
            ))}
          </nav>
          <button
            type="button"
            onClick={onLogout}
            className={`mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15 ${sidebarCollapsed ? "h-12 w-12 px-0" : "w-full"}`}
            title="Sair do sistema"
          >
            <LogOut size={18} /> {!sidebarCollapsed && "Sair do sistema"}
          </button>
        </aside>

        <main className={activeTab === "pdv" ? "min-w-0 px-3 py-3" : "min-w-0 px-4 py-6 xl:px-8"}>
          {activeTab !== "modulos" && activeTab !== "pdv" && (
            <button type="button" onClick={() => setActiveTab("modulos")} className="mb-5 inline-flex items-center gap-2 text-sm font-black uppercase text-blue-600 hover:text-blue-800">
              Voltar
            </button>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarButton({ active, icon: Icon, label, onClick, collapsed = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold transition ${collapsed ? "justify-center" : ""} ${active ? "bg-white/15 text-white" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}
    >
      <Icon size={19} />
      {!collapsed && label}
    </button>
  );
}

export function Metric({ title, value, detail, tone = "neutral" }) {
  const tones = {
    sky: "border-sky-200 bg-sky-50 text-sky-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
    neutral: "border-neutral-200 bg-white text-neutral-900",
  };

  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">{title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-sm font-semibold opacity-70">{detail}</p>
    </div>
  );
}

export function Panel({ title, children, actions }) {
  return (
    <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-black tracking-tight">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Input({ label, value, onChange, type = "text", placeholder = "", required = false, error = "", mask }) {
  function handleChange(event) {
    const nextValue = mask ? mask(event.target.value) : event.target.value;
    onChange(nextValue);
  }

  return (
    <label className="min-w-0 text-sm font-bold text-neutral-700">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-lg border px-3 py-2.5 text-neutral-950 outline-none focus:ring-4 ${error ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" : "border-neutral-300 focus:border-sky-500 focus:ring-sky-100"}`}
      />
      {error && <span className="mt-1 block text-xs font-bold text-red-600">{error}</span>}
    </label>
  );
}

export function SelectField({ label, value, onChange, children }) {
  return (
    <label className="min-w-0 text-sm font-bold text-neutral-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
        {children}
      </select>
    </label>
  );
}

export function Line({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="truncate font-semibold text-neutral-600">{label}</span>
      <span className="shrink-0 font-black text-neutral-950">{value}</span>
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    success: "bg-emerald-100 text-emerald-800",
    danger: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
    sky: "bg-sky-100 text-sky-800",
    neutral: "bg-neutral-100 text-neutral-700",
  };

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>;
}

export function Notice({ children, tone }) {
  const className = tone === "danger" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return <p className={`rounded-lg border p-3 text-sm font-semibold ${className}`}>{children}</p>;
}

export function TableWrap({ children }) {
  return <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">{children}</div>;
}

export function ToastStack({ toasts }) {
  return (
    <div className="fixed right-4 top-4 z-50 grid w-[min(360px,calc(100vw-2rem))] gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className={`rounded-lg border p-3 text-sm font-bold shadow-lg ${toast.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
      <p className="font-black text-neutral-800">{title}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-500">{description}</p>
    </div>
  );
}

export function Modal({ title, open, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-black text-slate-600 hover:bg-slate-50">
            Fechar
          </button>
        </header>
        <div className="p-5">{children}</div>
        {footer && <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4">{footer}</footer>}
      </section>
    </div>
  );
}

