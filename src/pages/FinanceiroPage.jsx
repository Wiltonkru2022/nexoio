import { useMemo, useState } from "react";
import { CheckCircle2, CircleDollarSign, Plus, Trash2 } from "lucide-react";
import { Badge, Input, Metric, Modal, Panel, SelectField, TableWrap } from "../components/ui";
import { formatMoney, parseMoney, today } from "../lib/storeData";
import { printFinancialReport } from "../lib/printing";
import { maskCurrency } from "../lib/validation";

const initialAccount = {
  description: "",
  type: "payable",
  status: "open",
  dueDate: today,
  amount: "",
  category: "",
  note: "",
  installments: "1",
  recurrence: "none",
};

const typeLabels = {
  payable: "A pagar",
  receivable: "A receber",
};

function accountDateLabel(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

export function FinanceiroPage({
  metrics,
  storeForm,
  saving,
  saveFinancialAccounts,
  cashSessions = [],
  cashMovements = [],
  orders = [],
}) {
  const [accountForm, setAccountForm] = useState(initialAccount);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [filter, setFilter] = useState("open");
  const accounts = useMemo(() => storeForm.financialAccounts || [], [storeForm.financialAccounts]);
  const validOrders = orders.filter((order) => order.status !== "Cancelado");
  const totalSupplies = cashMovements.filter((item) => item.type === "supply").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalWithdrawals = cashMovements.filter((item) => item.type === "withdrawal").reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const accountSummary = useMemo(() => {
    return accounts.reduce((acc, account) => {
      const amount = Number(account.amount || 0);
      if (account.type === "payable" && account.status === "open") acc.payable += amount;
      if (account.type === "receivable" && account.status === "open") acc.receivable += amount;
      if (account.status === "paid") acc.paid += amount;
      return acc;
    }, { payable: 0, receivable: 0, paid: 0 });
  }, [accounts]);

  async function addAccount(event) {
    event.preventDefault();
    if (!accountForm.description.trim()) return;
    const amount = parseMoney(accountForm.amount);
    const installments = Math.max(Number(accountForm.installments || 1), 1);
    const nextAccounts = Array.from({ length: installments }, (_, index) => {
      const dueDate = new Date(`${accountForm.dueDate}T00:00:00`);
      dueDate.setMonth(dueDate.getMonth() + index);
      return {
        id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        description: installments > 1 ? `${accountForm.description.trim()} (${index + 1}/${installments})` : accountForm.description.trim(),
        type: accountForm.type,
        status: accountForm.status,
        dueDate: dueDate.toISOString().slice(0, 10),
        amount: amount / installments,
        category: accountForm.category.trim(),
        note: accountForm.note.trim(),
        recurrence: accountForm.recurrence,
        createdAt: new Date().toISOString(),
      };
    });
    if (accountForm.recurrence === "monthly") {
      const baseDate = new Date(`${accountForm.dueDate}T00:00:00`);
      for (let index = installments; index < installments + 5; index += 1) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + index);
        nextAccounts.push({
          id: `${Date.now()}-rec-${index}-${Math.random().toString(16).slice(2)}`,
          description: `${accountForm.description.trim()} recorrente`,
          type: accountForm.type,
          status: "open",
          dueDate: dueDate.toISOString().slice(0, 10),
          amount,
          category: accountForm.category.trim(),
          note: accountForm.note.trim(),
          recurrence: "monthly",
          createdAt: new Date().toISOString(),
        });
      }
    }
    const ok = await saveFinancialAccounts([...accounts, ...nextAccounts]);
    if (ok) {
      setAccountForm(initialAccount);
      setAccountModalOpen(false);
    }
  }

  async function updateAccount(accountId, patch) {
    await saveFinancialAccounts(accounts.map((account) => account.id === accountId ? { ...account, ...patch, updatedAt: new Date().toISOString() } : account));
  }

  async function deleteAccount(accountId) {
    await saveFinancialAccounts(accounts.filter((account) => account.id !== accountId));
  }

  const filteredAccounts = accounts.filter((account) => {
    if (filter === "paid") return account.status === "paid";
    if (filter === "payable") return account.status === "open" && account.type === "payable";
    if (filter === "receivable") return account.status === "open" && account.type === "receivable";
    return account.status === "open";
  });

  function exportAccountsCsv() {
    const rows = [
      ["Descrição", "Tipo", "Categoria", "Vencimento", "Valor", "Status"],
      ...filteredAccounts.map((account) => [account.description, typeLabels[account.type], account.category || "", account.dueDate || "", account.amount || 0, account.status]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "financeiro-nexo.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-5">
        <Panel title="Resumo financeiro">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Metric title="Vendas" value={formatMoney(metrics.revenueTotal)} detail={`${validOrders.length} vendas válidas`} tone="sky" />
            <Metric title="Lucro estimado" value={formatMoney(metrics.profitTotal)} detail="Baseado no custo" tone="emerald" />
            <Metric title="A pagar" value={formatMoney(accountSummary.payable)} detail="Contas abertas" tone="danger" />
            <Metric title="A receber" value={formatMoney(accountSummary.receivable)} detail="Recebimentos pendentes" tone="amber" />
          </div>
        </Panel>

        <Panel title="Caixa e movimentações">
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric title="Caixas abertos" value={cashSessions.filter((session) => session.status === "open").length} detail="Sessão ativa" tone="emerald" />
            <Metric title="Caixas fechados" value={cashSessions.filter((session) => session.status === "closed").length} detail="Histórico" tone="neutral" />
            <Metric title="Suprimentos" value={formatMoney(totalSupplies)} detail="Entradas manuais" tone="sky" />
            <Metric title="Sangrias" value={formatMoney(totalWithdrawals)} detail="Saídas manuais" tone="amber" />
          </div>
        </Panel>

        <Modal title="Nova conta" open={accountModalOpen} onClose={() => setAccountModalOpen(false)}>
          <form className="grid gap-3" onSubmit={addAccount}>
            <Input label="Descrição" required value={accountForm.description} onChange={(value) => setAccountForm({ ...accountForm, description: value })} placeholder="Ex: Fornecedor de películas" />
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label="Tipo" value={accountForm.type} onChange={(value) => setAccountForm({ ...accountForm, type: value })}>
                <option value="payable">Conta a pagar</option>
                <option value="receivable">Conta a receber</option>
              </SelectField>
              <SelectField label="Status" value={accountForm.status} onChange={(value) => setAccountForm({ ...accountForm, status: value })}>
                <option value="open">Aberta</option>
                <option value="paid">Paga/recebida</option>
              </SelectField>
              <Input label="Vencimento" type="date" value={accountForm.dueDate} onChange={(value) => setAccountForm({ ...accountForm, dueDate: value })} />
              <Input label="Valor" value={accountForm.amount} onChange={(value) => setAccountForm({ ...accountForm, amount: value })} mask={maskCurrency} />
              <Input label="Parcelas" type="number" value={accountForm.installments} onChange={(value) => setAccountForm({ ...accountForm, installments: value })} />
              <SelectField label="Recorrência" value={accountForm.recurrence} onChange={(value) => setAccountForm({ ...accountForm, recurrence: value })}>
                <option value="none">Sem recorrência</option>
                <option value="monthly">Mensal</option>
              </SelectField>
            </div>
            <Input label="Categoria" value={accountForm.category} onChange={(value) => setAccountForm({ ...accountForm, category: value })} placeholder="Fornecedor, aluguel, venda a prazo..." />
            <Input label="Observação" value={accountForm.note} onChange={(value) => setAccountForm({ ...accountForm, note: value })} />
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              <Plus size={16} /> Adicionar conta
            </button>
          </form>
        </Modal>
        <button type="button" onClick={() => setAccountModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white">
          <Plus size={16} /> Nova conta
        </button>
      </div>

      <Panel
        title="Contas pagas e a pagar"
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportAccountsCsv} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Exportar</button>
            <button type="button" onClick={() => printFinancialReport({ store: storeForm, accounts: filteredAccounts, title: "Contas pagas e a pagar" })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Imprimir/PDF</button>
            <Badge tone="sky">{accounts.length} lançamentos</Badge>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ["open", "Abertas"],
            ["payable", "A pagar"],
            ["receivable", "A receber"],
            ["paid", "Pagas/recebidas"],
          ].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setFilter(id)} className={`rounded-lg px-3 py-2 text-xs font-black ${filter === id ? "bg-neutral-950 text-white" : "border border-neutral-300 bg-white text-neutral-600"}`}>
              {label}
            </button>
          ))}
        </div>
        <TableWrap>
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-sky-50/60">
                  <td className="px-4 py-3">
                    <p className="font-black">{account.description}</p>
                    <p className="text-xs text-neutral-500">{account.note || "Sem observação"}</p>
                  </td>
                  <td className="px-4 py-3">{typeLabels[account.type]}</td>
                  <td className="px-4 py-3 text-neutral-600">{account.category || "-"}</td>
                  <td className="px-4 py-3 text-neutral-600">{accountDateLabel(account.dueDate)}</td>
                  <td className="px-4 py-3 font-black">{formatMoney(account.amount)}</td>
                  <td className="px-4 py-3"><Badge tone={account.status === "paid" ? "success" : "amber"}>{account.status === "paid" ? "Pago" : "Aberto"}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => updateAccount(account.id, { status: account.status === "paid" ? "open" : "paid" })} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-700">
                        <CheckCircle2 size={14} /> {account.status === "paid" ? "Reabrir" : "Baixar"}
                      </button>
                      <button type="button" onClick={() => deleteAccount(account.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-700">
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredAccounts.length && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center font-bold text-neutral-500">
                    Nenhuma conta encontrada para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableWrap>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-600">
          <CircleDollarSign size={18} />
          Contas ficam salvas na loja e aparecem para usuários com permissão financeira.
        </div>
      </Panel>
    </div>
  );
}
