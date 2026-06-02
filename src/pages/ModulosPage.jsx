import {
  BadgeCheck,
  Boxes,
  ChevronRight,
  CloudUpload,
  CreditCard,
  FileBarChart,
  Grid2X2,
  Package,
  Plug,
  Printer,
  Puzzle,
  Settings,
  ShoppingCart,
  Store,
  Target,
  Ticket,
  Users,
  Wrench,
} from "lucide-react";

const modules = [
  { id: "pdv", title: "PDV Caixa", description: "Abrir o ponto de venda e realizar vendas.", action: "Abrir módulo", tone: "blue", Icon: Store },
  { id: "produtos", title: "Produtos", description: "Cadastrar e gerenciar produtos da loja.", tone: "green", Icon: Package },
  { id: "servicos", title: "Serviços", description: "Gerenciar serviços e mão de obra.", tone: "purple", Icon: Wrench },
  { id: "clientes", title: "Clientes", description: "Cadastrar e gerenciar seus clientes.", tone: "orange", Icon: Users },
  { id: "vendas", title: "Vendas", description: "Consultar e gerenciar todas as vendas.", tone: "blue", Icon: ShoppingCart },
  { id: "estoque", title: "Estoque", description: "Controle de estoque, entradas e saídas.", tone: "amber", Icon: Boxes },
  { id: "financeiro", title: "Financeiro", description: "Contas a pagar/receber, fluxo de caixa.", tone: "green", Icon: CreditCard },
  { id: "relatorios", title: "Relatórios", description: "Relatórios e indicadores do seu negócio.", tone: "purple", Icon: FileBarChart },
  { id: "equipe", title: "Usuários", description: "Gerenciar usuários e permissões de acesso.", tone: "blue", Icon: Users },
  { id: "configuracoes", title: "Configurações", description: "Configurações gerais do sistema.", tone: "slate", Icon: Settings },
  { id: "backup", title: "Backup", description: "Realizar backup e restaurar dados.", tone: "teal", Icon: CloudUpload },
  { id: "integracoes", title: "Integrações", description: "Integre com outras ferramentas.", tone: "rose", Icon: Plug },
  { id: "impressoes", title: "Impressões", description: "Configurar impressoras e layouts.", tone: "teal", Icon: Printer },
  { id: "cupons", title: "Cupons", description: "Gerenciar cupons e promoções.", tone: "rose", Icon: Ticket },
  { id: "metas", title: "Metas", description: "Definir e acompanhar metas de vendas.", tone: "blue", Icon: Target },
  { id: "modulos", title: "Mais módulos", description: "Em breve mais funcionalidades.", tone: "slate", Icon: Grid2X2, disabled: true },
];

const tones = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
  teal: "bg-teal-100 text-teal-700",
  rose: "bg-rose-100 text-rose-700",
};

export function ModulosPage({ setActiveTab }) {
  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <button type="button" className="mb-5 inline-flex items-center gap-2 text-sm font-black uppercase text-blue-600">
            ← Voltar
          </button>
          <h2 className="text-3xl font-black tracking-tight text-slate-950">Módulos do sistema</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Acesse rapidamente todas as funcionalidades do seu sistema.</p>
        </div>
        <div className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:w-[360px]">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <p className="text-sm font-black text-slate-500">Licença</p>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Ativa</span>
              </div>
              <p className="mt-4 font-black text-slate-950">Nexo PDV Pro</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Válida até 01/06/2027</p>
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">
              <BadgeCheck size={16} /> Ver detalhes
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {modules.map((module, index) => {
          const Icon = module.Icon || Puzzle;
          return (
            <button
              key={`${module.title}-${index}`}
              type="button"
              disabled={module.disabled}
              onClick={() => !module.disabled && setActiveTab(module.id)}
              className={`rounded-xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${module.disabled ? "border-dashed border-slate-300 opacity-70" : "border-slate-200"}`}
            >
              <div className="flex items-center gap-5">
                <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-xl ${tones[module.tone] || tones.blue}`}>
                  <Icon size={30} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-slate-950">{module.title}</p>
                    <ChevronRight size={20} className="text-slate-500" />
                  </div>
                  <p className="mt-2 min-h-10 text-sm font-semibold leading-5 text-slate-500">{module.description}</p>
                  <p className={`mt-4 text-sm font-black ${module.tone === "rose" ? "text-rose-600" : module.tone === "amber" || module.tone === "orange" ? "text-orange-500" : module.tone === "green" ? "text-emerald-600" : module.tone === "purple" ? "text-purple-600" : module.tone === "teal" ? "text-teal-600" : "text-blue-600"}`}>
                    {module.action || "Acessar módulo"} →
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
