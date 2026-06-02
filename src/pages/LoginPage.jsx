import { useState } from "react";
import { ArrowLeft, CheckCircle2, LogIn, Phone, ShieldCheck, Store } from "lucide-react";
import { Input, Notice } from "../components/ui";
import { maskCep, maskCpfCnpj, maskPhone } from "../lib/validation";

const planPrice = "R$ 99,90/mês";

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
  const [publicView, setPublicView] = useState(() => {
    if (typeof window !== "undefined" && window.location.hostname.startsWith("app.")) return "login";
    return "home";
  });

  function openLogin() {
    setAuthMode("login");
    clearMessages();
    setPublicView("login");
  }

  function openSignup() {
    setAuthMode("cadastro");
    clearMessages();
    setPublicView("cadastro");
  }

  if (publicView === "terms" || publicView === "privacy") {
    return <LegalPage type={publicView} onBack={() => setPublicView("home")} />;
  }

  return (
    <PublicFrame activeView={publicView} setPublicView={setPublicView} openLogin={openLogin} openSignup={openSignup}>
      {publicView === "login" && (
        <SplitAuthLayout
          eyebrow="Acesso da loja"
          title="Entre para abrir o caixa e gerenciar sua operação."
          description="Login seguro com Firebase, permissões por usuário e dados isolados por loja."
        >
          <AuthCard title="Entrar no sistema" subtitle="Use seu e-mail e senha cadastrados." icon={LogIn}>
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
          title="Cadastre sua loja com identidade, endereço e aceite legal."
          description="Depois do cadastro, sua loja já nasce com PDV, produtos iniciais, assistência e permissões de dono/admin."
        >
          <AuthCard title="Criar conta da loja" subtitle="Preencha os dados para iniciar." icon={Store} wide>
            <form className="mt-7 space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="E-mail" type="email" required value={email} onChange={setEmail} placeholder="loja@email.com" />
                <Input label="Senha" type="password" required value={senha} onChange={setSenha} placeholder="Digite sua senha" />
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
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
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">
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
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div className="grid gap-6">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">Nexo.io Eletrônicos</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                PDV, estoque e assistência técnica para lojas de eletrônicos.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Venda capinhas e acessórios, controle películas, abra OS, gerencie clientes, caixa e relatórios em uma operação simples e profissional.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {["PDV com caixa", "OS com impressão", "Firebase multi-loja"].map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <CheckCircle2 className="text-emerald-600" size={22} />
                  <p className="mt-3 font-black">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-blue-100 bg-white p-6 shadow-2xl shadow-slate-200">
            <p className="text-sm font-black uppercase tracking-wide text-blue-700">Plano único</p>
            <p className="mt-3 text-4xl font-black">{planPrice}</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">Inclui PDV, produtos, clientes, OS, caixa, relatórios e configurações.</p>
            <div className="mt-6 grid gap-2">
              {["Multi-loja com isolamento", "Controle de equipe e permissões", "Comprovantes e OS em 2 vias"].map((item) => (
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
        </section>
      )}
    </PublicFrame>
  );
}

function PublicFrame({ children, activeView, setPublicView, openLogin, openSignup }) {
  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
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
      <main className="mx-auto min-h-[calc(100vh-5rem)] max-w-7xl px-5 py-8">
        {children}
      </main>
    </div>
  );
}

function SplitAuthLayout({ eyebrow, title, description, children }) {
  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(500px,0.85fr)] lg:items-start">
      <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950">{title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black uppercase text-blue-700">Plano único</p>
          <p className="mt-2 text-3xl font-black">{planPrice}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Sem módulos escondidos na primeira versão.</p>
        </div>
        <div className="mt-5 grid gap-2">
          {["PDV e caixa", "Produtos, clientes e vendas", "OS com impressão em 2 vias"].map((item) => (
            <p key={item} className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <CheckCircle2 size={16} className="text-emerald-600" /> {item}
            </p>
          ))}
        </div>
      </aside>
      {children}
    </section>
  );
}

function AuthCard({ title, subtitle, icon: Icon, children, wide = false }) {
  return (
    <section className={`w-full rounded-xl border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-200 ${wide ? "max-w-3xl" : "max-w-xl"}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-700">
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

function PublicLogo() {
  return (
    <button type="button" className="flex items-center gap-3" onClick={() => window.location.reload()}>
      <img src="/brand/nexoio-mark.png" alt="Nexo.io" className="h-10 w-10 rounded-lg object-cover" />
      <span className="text-2xl font-black tracking-tight text-slate-950">Nexo<span className="text-blue-600">.io</span></span>
    </button>
  );
}

function LegalPage({ type, onBack }) {
  const isTerms = type === "terms";
  return (
    <div className="min-h-screen bg-[#f6f8fc] px-5 py-8 text-slate-950">
      <main className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700">
          <ArrowLeft size={16} /> Voltar
        </button>
        <PublicLogo />
        <div className="mt-8 flex items-center gap-3">
          <ShieldCheck className="text-blue-700" size={28} />
          <h1 className="text-3xl font-black">{isTerms ? "Termos de Uso" : "Política de Privacidade"}</h1>
        </div>
        <div className="mt-6 space-y-4 text-sm font-semibold leading-7 text-slate-600">
          {isTerms ? (
            <>
              <p>Ao usar o Nexo.io, a loja concorda em manter dados corretos, proteger seus acessos e utilizar o sistema de forma lícita na gestão de vendas, clientes, estoque e ordens de serviço.</p>
              <p>O sistema registra operações, vendas, caixas e cadastros vinculados à loja. Cada usuário deve usar seu próprio login e respeitar as permissões definidas pelo administrador.</p>
              <p>Recursos de integrações, como OpenPix e Google Drive, dependem de credenciais fornecidas pela própria loja e podem exigir backend seguro para execução completa.</p>
            </>
          ) : (
            <>
              <p>Coletamos dados necessários para autenticação, cadastro da loja, usuários, clientes, produtos, vendas, caixa e ordens de serviço.</p>
              <p>Os dados são armazenados no Firebase com isolamento por loja. O acesso depende de autenticação e das regras de permissão configuradas para cada usuário.</p>
              <p>A loja é responsável por informar seus clientes sobre o tratamento de dados pessoais usados em vendas, assistência técnica, comprovantes e comunicação.</p>
            </>
          )}
          <p className="rounded-lg bg-slate-50 p-4 text-slate-700">Contato: (67) 9 8434-1742</p>
        </div>
      </main>
    </div>
  );
}
