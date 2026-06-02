import { useMemo, useState } from "react";
import { Edit3, Plus, Save, Search, Trash2, UserRound } from "lucide-react";
import { Badge, Input, Line, Metric, Modal, Panel, TableWrap } from "../components/ui";
import { formatMoney, initialCustomerForm } from "../lib/storeData";
import { maskCep, maskCpfCnpj, maskPhone } from "../lib/validation";

export function ClientesPage({ customerForm, setCustomerForm, customers, saving, errors, handleCustomerSubmit, deleteCustomer }) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) => [customer.name, customer.phone, customer.document, customer.device, customer.city]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(term)));
  }, [customers, search]);

  const customersWithCredit = customers.filter((customer) => Number(customer.credit || 0) > 0).length;
  const totalSpent = customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0);

  function startNew() {
    setCustomerForm(initialCustomerForm);
    setSelectedCustomer(null);
    setFormOpen(true);
  }

  function startEdit(customer) {
    setCustomerForm({ ...initialCustomerForm, ...customer });
    setSelectedCustomer(null);
    setFormOpen(true);
  }

  async function submitCustomer(event) {
    const ok = await handleCustomerSubmit(event);
    if (ok) setFormOpen(false);
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric title="Clientes" value={customers.length} detail="cadastros ativos" tone="sky" />
        <Metric title="Créditos" value={customersWithCredit} detail="clientes com saldo" tone="emerald" />
        <Metric title="Total gasto" value={formatMoney(totalSpent)} detail="histórico acumulado" tone="neutral" />
      </div>

      <Panel
        title="Clientes"
        actions={
          <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-700">
            <Plus size={16} /> Novo cliente
          </button>
        }
      >
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
            placeholder="Buscar por nome, telefone, CPF/CNPJ, aparelho ou cidade"
          />
        </div>

        <TableWrap>
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Aparelho</th>
                <th className="px-4 py-3">Endereço</th>
                <th className="px-4 py-3 text-right">Total gasto</th>
                <th className="px-4 py-3 text-right">Crédito</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} onClick={() => setSelectedCustomer(customer)} className="cursor-pointer transition hover:bg-blue-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
                        <UserRound size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900">{customer.name || "Cliente sem nome"}</p>
                        <p className="truncate text-xs font-semibold text-slate-500">{customer.phone || "Sem telefone"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{customer.document || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{customer.device || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {[customer.street, customer.number, customer.neighborhood, customer.city, customer.state].filter(Boolean).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-900">{formatMoney(customer.totalSpent)}</td>
                  <td className="px-4 py-3 text-right font-black text-blue-700">{formatMoney(customer.credit)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={Number(customer.credit || 0) > 0 ? "sky" : "success"}>{Number(customer.credit || 0) > 0 ? "Com crédito" : "Ativo"}</Badge>
                  </td>
                </tr>
              ))}
              {!filteredCustomers.length && (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-sm font-bold text-slate-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableWrap>
      </Panel>

      <Modal title="Detalhes do cliente" open={Boolean(selectedCustomer)} onClose={() => setSelectedCustomer(null)}>
        {selectedCustomer && (
          <div className="grid gap-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xl font-black text-slate-950">{selectedCustomer.name}</p>
              <p className="text-sm font-semibold text-slate-500">{selectedCustomer.phone || "Sem telefone"}</p>
            </div>
            <div className="grid gap-2">
              <Line label="CPF/CNPJ" value={selectedCustomer.document || "-"} />
              <Line label="Aparelho" value={selectedCustomer.device || "-"} />
              <Line label="CEP" value={selectedCustomer.cep || "-"} />
              <Line label="Endereço" value={[selectedCustomer.street, selectedCustomer.number, selectedCustomer.neighborhood].filter(Boolean).join(", ") || "-"} />
              <Line label="Cidade/UF" value={[selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(" / ") || "-"} />
              <Line label="Total gasto" value={formatMoney(selectedCustomer.totalSpent)} />
              <Line label="Crédito" value={formatMoney(selectedCustomer.credit)} />
              <Line label="Observação" value={selectedCustomer.note || "-"} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => startEdit(selectedCustomer)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white">
                <Edit3 size={16} /> Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCustomer(selectedCustomer.id);
                  setSelectedCustomer(null);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-black text-white"
              >
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal title={customerForm.id ? "Editar cliente" : "Novo cliente"} open={formOpen} onClose={() => setFormOpen(false)}>
        <form className="grid gap-5" onSubmit={submitCustomer}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Nome" required value={customerForm.name} onChange={(value) => setCustomerForm({ ...customerForm, name: value })} error={errors.customerName} />
            <Input label="WhatsApp" value={customerForm.phone} onChange={(value) => setCustomerForm({ ...customerForm, phone: value })} mask={maskPhone} />
            <Input label="CPF/CNPJ" value={customerForm.document} onChange={(value) => setCustomerForm({ ...customerForm, document: value })} mask={maskCpfCnpj} error={errors.customerDocument} />
            <Input label="Aparelho principal" value={customerForm.device} onChange={(value) => setCustomerForm({ ...customerForm, device: value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Input label="CEP" value={customerForm.cep} onChange={(value) => setCustomerForm({ ...customerForm, cep: value })} mask={maskCep} error={errors.customerCep} />
            <Input label="Número" value={customerForm.number} onChange={(value) => setCustomerForm({ ...customerForm, number: value })} />
            <div className="md:col-span-2">
              <Input label="Rua" value={customerForm.street} onChange={(value) => setCustomerForm({ ...customerForm, street: value })} />
            </div>
            <Input label="Bairro" value={customerForm.neighborhood} onChange={(value) => setCustomerForm({ ...customerForm, neighborhood: value })} />
            <Input label="Cidade" value={customerForm.city} onChange={(value) => setCustomerForm({ ...customerForm, city: value })} />
            <Input label="UF" value={customerForm.state} onChange={(value) => setCustomerForm({ ...customerForm, state: value.toUpperCase().slice(0, 2) })} />
          </div>
          <label className="text-sm font-bold text-neutral-700">
            Observação
            <textarea value={customerForm.note} onChange={(event) => setCustomerForm({ ...customerForm, note: event.target.value })} className="mt-2 min-h-24 w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </label>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              <Save size={16} /> Salvar cliente
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
