import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  LogIn,
  Package,
  Phone,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
  Wrench,
} from "lucide-react";
import { Input, Notice } from "../components/ui";
import { maskCep, maskCpfCnpj, maskPhone } from "../lib/validation";

const planPrice = "R$ 1,00/mês";

const highlights = [
  { icon: ShoppingCart, title: "PDV com caixa", text: "Venda produtos, serviços e acompanhe pagamentos no balcão." },
  { icon: Wrench, title: "Assistência técnica", text: "Abra OS, registre peças, serviços, técnico e imprima 2 vias." },
  { icon: Package, title: "Produtos e estoque", text: "Controle cadastro, custo, preço, fornecedor e estoque mínimo." },
  { icon: Users, title: "Clientes e equipe", text: "Cadastre clientes, organize usuários e permissões por função." },
  { icon: Receipt, title: "Comprovantes", text: "Recibos de venda, OS, sangria, suprimento e fechamento." },
  { icon: BarChart3, title: "Relatórios", text: "Veja vendas, ticket médio, lucro, produtos e fluxo financeiro." },
];

const planItems = [
  "PDV, produtos, estoque e clientes",
  "OS técnica com impressão em 2 vias",
  "Vendas, financeiro e relatórios",
  "Controle de usuários e permissões",
];

const APP_URL = "https://app.nexoio.com.br";
const MARKETING_HOSTS = new Set(["nexoio.com.br", "www.nexoio.com.br"]);

function viewFromLocation() {
  if (typeof window === "undefined") return "home";
  const { hostname, pathname } = window.location;

  if (pathname === "/cadastro") return "cadastro";
  if (pathname === "/login") return "login";
  if (hostname.startsWith("app.")) return "login";

  return "home";
}

function navigatePublicView(view) {
  if (typeof window === "undefined") return;

  const path = view === "cadastro" ? "/cadastro" : view === "login" ? "/login" : "/";
  if (MARKETING_HOSTS.has(window.location.hostname) && view !== "home") {
    window.location.assign(`${APP_URL}${path}`);
    return;
  }

  window.history.pushState({ publicView: view }, "", path);
}

export function LoginPage({
  setAuthMode,
  email,
  setEmail,
  senha,
  setSenha,
  signupStoreForm,
  setSignupStoreForm,
  acceptedTerms,
  setAcceptedTerms,
  erro,
  sucesso,
  errors,
  onSubmit,
  clearMessages,
}) {
  const [publicView, setPublicView] = useState(viewFromLocation);

  useEffect(() => {
    setAuthMode(publicView === "cadastro" ? "cadastro" : "login");
  }, [publicView, setAuthMode]);

  useEffect(() => {
    function handlePopState() {
      setPublicView(viewFromLocation());
      clearMessages();
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [clearMessages]);

  function openLogin() {
    clearMessages();
    setPublicView("login");
    navigatePublicView("login");
  }

  function openSignup() {
    clearMessages();
    setPublicView("cadastro");
    navigatePublicView("cadastro");
  }

  if (publicView === "terms" || publicView === "privacy") {
    return <LegalPage type={publicView} onBack={() => setPublicView("home")} />;
  }

  return (
    <PublicFrame activeView={publicView} setPublicView={setPublicView} openLogin={openLogin} openSignup={openSignup}>
      {publicView === "login" && (
        <SplitAuthLayout
          eyebrow="Acesso da loja"
          title="Entre para vender, atender e acompanhar sua operação."
          description="Use seu acesso para abrir o caixa, consultar clientes, registrar vendas, controlar OS e acompanhar o movimento da loja."
        >
          <AuthCard title="Entrar no sistema" subtitle="Informe o e-mail e a senha cadastrados." icon={LogIn}>
            <form className="mt-7 space-y-4" onSubmit={onSubmit}>
              <Input label="E-mail" type="email" required value={email} onChange={setEmail} placeholder="loja@email.com" />
              <Input label="Senha" type="password" required value={senha} onChange={setSenha} placeholder="Digite sua senha" />
              {erro && <Notice tone="danger">{erro}</Notice>}
              {sucesso && <Notice tone="success">{sucesso}</Notice>}
              <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700">
                Entrar
              </button>
            </form>
            <button type="button" onClick={openSignup} className="mt-5 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
              Criar uma nova conta
            </button>
          </AuthCard>
        </SplitAuthLayout>
      )}

      {publicView === "cadastro" && (
        <SplitAuthLayout
          eyebrow="Comece agora"
          title="Cadastre sua loja e libere seu ambiente de trabalho."
          description="Após o cadastro, você configura sua loja, aceita os termos e regulariza o plano para acessar o sistema."
        >
          <AuthCard title="Criar conta da loja" subtitle="Preencha os dados principais para iniciar." icon={Store} wide>
            <form className="mt-7 space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="E-mail" type="email" required value={email} onChange={setEmail} placeholder="loja@email.com" />
                <Input label="Senha" type="password" required value={senha} onChange={setSenha} placeholder="Digite sua senha" />
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-sm font-black uppercase tracking-wide text-blue-800">Dados da loja</p>
                <div className="mt-4 grid gap-3">
                  <Input label="Nome da loja" required value={signupStoreForm.name} onChange={(value) => setSignupStoreForm({ ...signupStoreForm, name: value })} error={errors.signupStoreName} placeholder="Ex: Nexoio Eletrônicos" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input label="CPF/CNPJ" value={signupStoreForm.document} onChange={(value) => setSignupStoreForm({ ...signupStoreForm, document: value })} mask={maskCpfCnpj} error={errors.signupStoreDocument} />
                    <Input label="Telefone" value={signupStoreForm.phone} onChange={(value) => setSignupStoreForm({ ...signupStoreForm, phone: value })} mask={maskPhone} />
                    <Input label="CEP" value={signupStoreForm.cep} onChange={(value) => setSignupStoreForm({ ...signupStoreForm, cep: value })} mask={maskCep} error={errors.signupStoreCep} />
                    <Input label="Número" value={signupStoreForm.number} onChange={(value) => setSignupStoreForm({ ...signupStoreForm, number: value })} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                    <Input label="Cidade" value={signupStoreForm.city} onChange={(value) => setSignupStoreForm({ ...signupStoreForm, city: value })} />
                    <Input label="UF" value={signupStoreForm.state} onChange={(value) => setSignupStoreForm({ ...signupStoreForm, state: value.toUpperCase().slice(0, 2) })} />
                  </div>
                  <Input label="Rua" value={signupStoreForm.street} onChange={(value) => setSignupStoreForm({ ...signupStoreForm, street: value })} />
                  <Input label="Bairro" value={signupStoreForm.neighborhood} onChange={(value) => setSignupStoreForm({ ...signupStoreForm, neighborhood: value })} />
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-5 w-5 accent-blue-600" />
                <span>
                  Aceito os <button type="button" onClick={() => setPublicView("terms")} className="font-black text-blue-700">Termos de Uso</button> e a <button type="button" onClick={() => setPublicView("privacy")} className="font-black text-blue-700">Política de Privacidade</button>.
                  {errors.acceptedTerms && <span className="mt-1 block text-xs font-black text-red-600">{errors.acceptedTerms}</span>}
                </span>
              </label>
              {erro && <Notice tone="danger">{erro}</Notice>}
              {sucesso && <Notice tone="success">{sucesso}</Notice>}
              <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700">
                Cadastrar loja
              </button>
            </form>
            <button type="button" onClick={openLogin} className="mt-5 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
              Já tenho conta
            </button>
          </AuthCard>
        </SplitAuthLayout>
      )}

      {publicView === "home" && (
        <div className="grid gap-12">
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
            <div className="grid gap-6">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">Nexo.io para eletrônicos</p>
                <h1 className="mt-4 max-w-4xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                  PDV, estoque e assistência técnica no mesmo sistema.
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                  Venda capinhas, películas e acessórios, abra ordens de serviço, controle caixa, clientes, produtos, equipe e relatórios em uma operação simples de usar.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <MiniMetric value="2 vias" label="OS e comprovantes" />
                <MiniMetric value="1 tela" label="PDV com carrinho e pagamentos" />
                <MiniMetric value="R$ 1,00" label="Plano mensal único" />
              </div>
            </div>

            <PlanCard openSignup={openSignup} openLogin={openLogin} />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {highlights.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon size={22} />
                </span>
                <h2 className="mt-4 text-lg font-black">{title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[0.85fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Fluxo de loja</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Do balcão ao relatório, sem bagunça.</h2>
              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                O Nexo.io organiza os atendimentos do dia, registra as entradas e saídas do caixa e deixa as informações prontas para conferir no fechamento.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <FlowStep icon={Clock} title="Abra o caixa" text="Defina operador e saldo inicial." />
              <FlowStep icon={ShoppingCart} title="Venda ou abra OS" text="Produto, serviço, cliente e pagamento." />
              <FlowStep icon={BarChart3} title="Confira o dia" text="Vendas, lucro, pendências e estoque." />
            </div>
          </section>
        </div>
      )}
    </PublicFrame>
  );
}

function PublicFrame({ children, activeView, setPublicView, openLogin, openSignup }) {
  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center gap-4 px-5">
          <PublicLogo />
          <nav className="ml-auto flex flex-wrap items-center gap-3 text-sm font-black text-slate-700">
            <button type="button" onClick={() => setPublicView("terms")} className="hover:text-blue-700">Termos de uso</button>
            <button type="button" onClick={() => setPublicView("privacy")} className="hover:text-blue-700">Privacidade</button>
            {activeView !== "login" && <button type="button" onClick={openLogin} className="hover:text-blue-700">Login</button>}
            {activeView !== "cadastro" && <button type="button" onClick={openSignup} className="hover:text-blue-700">Cadastro</button>}
            <a href="tel:+5567984341742" className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-blue-700">
              <Phone size={16} /> (67) 9 8434-1742
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100vh-5rem)] max-w-7xl px-5 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}

function SplitAuthLayout({ eyebrow, title, description, children }) {
  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(500px,0.85fr)] lg:items-start">
      <aside className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950">{title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {highlights.slice(0, 4).map(({ icon: Icon, title: itemTitle }) => (
            <div key={itemTitle} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Icon size={20} className="text-blue-700" />
              <p className="mt-3 text-sm font-black">{itemTitle}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-black uppercase text-blue-700">Plano único</p>
          <p className="mt-2 text-3xl font-black">{planPrice}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Inclui os módulos principais da loja.</p>
        </div>
      </aside>
      {children}
    </section>
  );
}

function AuthCard({ title, subtitle, icon: Icon, children, wide = false }) {
  return (
    <section className={`w-full rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-200 ${wide ? "max-w-3xl" : "max-w-xl"}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Icon size={22} />
        </span>
        <div>
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PlanCard({ openSignup, openLogin }) {
  return (
    <aside className="rounded-2xl border border-blue-100 bg-white p-6 shadow-2xl shadow-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-blue-700">Plano único</p>
          <p className="mt-3 text-4xl font-black">{planPrice}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-700">Pix mensal</span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        Pensado para lojas de eletrônicos que precisam vender, controlar estoque e atender assistência técnica sem complicar a rotina.
      </p>
      <div className="mt-6 grid gap-3">
        {planItems.map((item) => (
          <p key={item} className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <CheckCircle2 size={16} className="text-emerald-600" /> {item}
          </p>
        ))}
      </div>
      <div className="mt-6 grid gap-3">
        <button type="button" onClick={openSignup} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700">
          Criar conta da loja
        </button>
        <button type="button" onClick={openLogin} className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
          Entrar no sistema
        </button>
      </div>
    </aside>
  );
}

function MiniMetric({ value, label }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function FlowStep({ icon: Icon, title, text }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <Icon size={22} className="text-blue-700" />
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function PublicLogo() {
  return (
    <button type="button" className="flex items-center gap-3" onClick={() => window.location.assign("/")}>
      <img src="/brand/nexoio-mark.png" alt="Nexo.io" className="h-10 w-10 rounded-lg object-cover" />
      <span className="text-2xl font-black tracking-tight text-slate-950">Nexo<span className="text-blue-600">.io</span></span>
    </button>
  );
}

function LegalPage({ type, onBack }) {
  const isTerms = type === "terms";
  return (
    <div className="min-h-screen bg-[#f6f8fc] px-5 py-8 text-slate-950">
      <main className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <button type="button" onClick={onBack} className="mb-8 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
          <ArrowLeft size={16} /> Voltar
        </button>
        <PublicLogo />
        <div className="mt-10 flex items-center gap-3">
          <ShieldCheck className="text-blue-700" size={32} />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">Nexo.io</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">{isTerms ? "Termos de Uso" : "Política de Privacidade"}</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-5 text-base font-semibold leading-8 text-slate-600">
          {isTerms ? (
            <>
              <LegalBlock title="Uso do sistema">
                Ao usar o Nexo.io, a loja concorda em manter dados corretos, proteger seus acessos e utilizar o sistema de forma lícita na gestão de vendas, clientes, estoque, caixa e ordens de serviço.
              </LegalBlock>
              <LegalBlock title="Responsabilidade da loja">
                Cada usuário deve usar seu próprio login. O administrador da loja é responsável por definir permissões, revisar acessos da equipe e manter as informações comerciais atualizadas.
              </LegalBlock>
              <LegalBlock title="Pagamentos e disponibilidade">
                O acesso ao sistema pode depender da assinatura ativa. Instabilidades de internet, serviços externos de pagamento, impressão, backup ou integrações podem afetar recursos específicos.
              </LegalBlock>
              <LegalBlock title="Comprovantes e registros">
                Vendas, caixas, movimentações e ordens de serviço podem gerar registros operacionais. A loja deve conferir as informações antes de entregar comprovantes ao cliente final.
              </LegalBlock>
            </>
          ) : (
            <>
              <LegalBlock title="Dados coletados">
                Coletamos dados necessários para autenticação, cadastro da loja, usuários, clientes, produtos, vendas, caixa, assistência técnica e emissão de comprovantes.
              </LegalBlock>
              <LegalBlock title="Finalidade">
                As informações são usadas para operar o sistema, controlar acessos, registrar atividades da loja, gerar relatórios e permitir o atendimento aos clientes.
              </LegalBlock>
              <LegalBlock title="Segurança e acesso">
                O acesso depende de login e permissões. A loja deve manter senhas protegidas e revisar usuários ativos para evitar uso indevido das informações.
              </LegalBlock>
              <LegalBlock title="Clientes da loja">
                A loja é responsável por informar seus próprios clientes sobre o uso de dados pessoais em vendas, assistência técnica, comprovantes, garantia e comunicação.
              </LegalBlock>
            </>
          )}
          <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-5 text-slate-700">
            <p className="font-black">Contato</p>
            <p className="mt-1">WhatsApp/telefone: (67) 9 8434-1742</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function LegalBlock({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
