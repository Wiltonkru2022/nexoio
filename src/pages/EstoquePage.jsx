import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, Truck } from "lucide-react";
import { Badge, Input, Line, Metric, Modal, Panel, TableWrap } from "../components/ui";
import { formatMoney } from "../lib/storeData";
import { maskCpfCnpj, maskPhone } from "../lib/validation";

const initialSupplier = {
  name: "",
  document: "",
  phone: "",
  contact: "",
  note: "",
};

export function EstoquePage({
  productFilter,
  setProductFilter,
  filteredProducts,
  products,
  stockMovements = [],
  updateStock,
  storeForm,
  saveSuppliers,
  saving,
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementAmount, setMovementAmount] = useState(1);
  const [supplierForm, setSupplierForm] = useState(initialSupplier);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const suppliers = useMemo(() => storeForm.suppliers || [], [storeForm.suppliers]);

  const supplierNames = useMemo(() => {
    const names = new Set(suppliers.map((supplier) => supplier.name).filter(Boolean));
    products.forEach((product) => {
      if (product.supplier) names.add(product.supplier);
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [products, suppliers]);

  const stockSummary = useMemo(() => {
    return products.reduce((acc, product) => {
      const stock = Number(product.stock || 0);
      const minStock = Number(product.minStock || 0);
      acc.items += stock;
      acc.value += stock * Number(product.cost || 0);
      if (stock <= minStock) acc.low += 1;
      return acc;
    }, { items: 0, value: 0, low: 0 });
  }, [products]);

  async function addSupplier(event) {
    event.preventDefault();
    if (!supplierForm.name.trim()) return;
    const payload = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...supplierForm,
      name: supplierForm.name.trim(),
      createdAt: new Date().toISOString(),
    };
    const ok = await saveSuppliers([...suppliers, payload]);
    if (ok) {
      setSupplierForm(initialSupplier);
      setSupplierModalOpen(false);
    }
  }

  async function deleteSupplier(supplierId) {
    await saveSuppliers(suppliers.filter((supplier) => supplier.id !== supplierId));
  }

  async function updateSupplier(event) {
    event.preventDefault();
    if (!editingSupplier?.name?.trim()) return;
    const ok = await saveSuppliers(suppliers.map((supplier) => supplier.id === editingSupplier.id ? {
      ...editingSupplier,
      updatedAt: new Date().toISOString(),
    } : supplier));
    if (ok) setEditingSupplier(null);
  }

  function moveStock(product, direction) {
    const amount = Math.max(Number(movementAmount || 1), 1);
    updateStock(product, direction === "in" ? amount : -amount);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric title="Itens em estoque" value={stockSummary.items} detail={`${products.length} produtos`} tone="sky" />
          <Metric title="Valor de custo" value={formatMoney(stockSummary.value)} detail="Estoque estimado" tone="emerald" />
          <Metric title="Estoque baixo" value={stockSummary.low} detail="Produtos no mínimo" tone={stockSummary.low ? "danger" : "neutral"} />
          <Metric title="Fornecedores" value={supplierNames.length} detail="Cadastrados e vinculados" tone="amber" />
        </div>

        <Panel title="Gerenciar estoque" actions={<Badge tone="sky">{filteredProducts.length} produtos</Badge>}>
          <div className="mb-4">
            <Input label="Buscar no estoque" value={productFilter} onChange={setProductFilter} placeholder="Buscar por produto, SKU, categoria, modelo ou fornecedor" />
          </div>
          <TableWrap>
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Fornecedor</th>
                  <th className="px-4 py-3">Atual</th>
                  <th className="px-4 py-3">Mínimo</th>
                  <th className="px-4 py-3">Custo</th>
                  <th className="px-4 py-3">Movimentar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {filteredProducts.map((product) => {
                  const low = Number(product.stock || 0) <= Number(product.minStock || 0);
                  return (
                    <tr key={product.id} onClick={() => setSelectedProduct(product)} className="cursor-pointer transition hover:bg-sky-50/60">
                      <td className="px-4 py-3">
                        <p className="font-black">{product.name}</p>
                        <p className="text-xs text-neutral-500">{product.sku || "Sem SKU"} · {product.category || "Sem categoria"}</p>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{product.supplier || "-"}</td>
                      <td className="px-4 py-3"><Badge tone={low ? "danger" : "success"}>{product.stock || 0} un</Badge></td>
                      <td className="px-4 py-3 text-neutral-600">{product.minStock || 0} un</td>
                      <td className="px-4 py-3 font-black">{formatMoney(product.cost)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700">Abrir</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      </div>

      <div className="space-y-5">
        <button type="button" onClick={() => setSupplierModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white">
          <Plus size={16} /> Novo fornecedor
        </button>

        <Modal title="Novo fornecedor" open={supplierModalOpen} onClose={() => setSupplierModalOpen(false)}>
          <form className="grid gap-3" onSubmit={addSupplier}>
            <Input label="Fornecedor" required value={supplierForm.name} onChange={(value) => setSupplierForm({ ...supplierForm, name: value })} placeholder="Nome do fornecedor" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="CPF/CNPJ" value={supplierForm.document} onChange={(value) => setSupplierForm({ ...supplierForm, document: value })} mask={maskCpfCnpj} />
              <Input label="Telefone" value={supplierForm.phone} onChange={(value) => setSupplierForm({ ...supplierForm, phone: value })} mask={maskPhone} />
            </div>
            <Input label="Contato" value={supplierForm.contact} onChange={(value) => setSupplierForm({ ...supplierForm, contact: value })} placeholder="Pessoa de contato" />
            <Input label="Observação" value={supplierForm.note} onChange={(value) => setSupplierForm({ ...supplierForm, note: value })} />
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              <Plus size={16} /> Salvar fornecedor
            </button>
          </form>
        </Modal>

        <Panel title="Fornecedores">
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{supplier.name}</p>
                    <p className="text-xs font-semibold text-neutral-500">{supplier.phone || "Sem telefone"} · {supplier.document || "Sem documento"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingSupplier(supplier)} className="rounded-lg border border-sky-200 px-3 py-2 text-xs font-black text-sky-700">
                      Editar
                    </button>
                    <button type="button" onClick={() => deleteSupplier(supplier.id)} className="rounded-lg border border-red-200 p-2 text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {supplier.contact && <p className="mt-2 text-sm font-semibold text-neutral-600">Contato: {supplier.contact}</p>}
              </div>
            ))}
            {!suppliers.length && (
              <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-5 text-center">
                <Truck className="mx-auto text-neutral-400" size={28} />
                <p className="mt-2 text-sm font-black text-neutral-700">Nenhum fornecedor cadastrado.</p>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Modal title="Movimentar estoque" open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)}>
        {selectedProduct && (
          <div className="grid gap-4">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xl font-black">{selectedProduct.name}</p>
              <p className="text-sm font-semibold text-neutral-500">{selectedProduct.sku || "Sem SKU"} · {selectedProduct.supplier || "Sem fornecedor"}</p>
            </div>
            <div className="grid gap-2">
              <Line label="Estoque atual" value={`${selectedProduct.stock || 0} un`} />
              <Line label="Estoque mínimo" value={`${selectedProduct.minStock || 0} un`} />
              <Line label="Custo unitário" value={formatMoney(selectedProduct.cost)} />
              <Line label="Valor em estoque" value={formatMoney(Number(selectedProduct.stock || 0) * Number(selectedProduct.cost || 0))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <Input label="Quantidade" type="number" value={movementAmount} onChange={setMovementAmount} />
              <button type="button" onClick={() => moveStock(selectedProduct, "out")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-black text-red-700">
                <ArrowDownCircle size={16} /> Saída
              </button>
              <button type="button" onClick={() => moveStock(selectedProduct, "in")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-3 text-sm font-black text-emerald-700">
                <ArrowUpCircle size={16} /> Entrada
              </button>
            </div>
          </div>
          )}
      </Modal>

      <Panel title="Histórico de estoque">
        <TableWrap>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Qtd</th>
                <th className="px-4 py-3">Antes</th>
                <th className="px-4 py-3">Depois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {stockMovements.slice(0, 12).map((movement) => (
                <tr key={movement.id}>
                  <td className="px-4 py-3 font-black">{movement.productName}</td>
                  <td className="px-4 py-3 text-neutral-600">{movement.source || movement.type}</td>
                  <td className={`px-4 py-3 font-black ${Number(movement.quantity || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>{movement.quantity}</td>
                  <td className="px-4 py-3">{movement.previousStock}</td>
                  <td className="px-4 py-3">{movement.nextStock}</td>
                </tr>
              ))}
              {!stockMovements.length && <tr><td colSpan="5" className="px-4 py-8 text-center font-bold text-neutral-500">Nenhuma movimentação registrada.</td></tr>}
            </tbody>
          </table>
        </TableWrap>
      </Panel>

      <Modal title="Editar fornecedor" open={Boolean(editingSupplier)} onClose={() => setEditingSupplier(null)}>
        {editingSupplier && (
          <form className="grid gap-3" onSubmit={updateSupplier}>
            <Input label="Fornecedor" required value={editingSupplier.name} onChange={(value) => setEditingSupplier({ ...editingSupplier, name: value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="CPF/CNPJ" value={editingSupplier.document || ""} onChange={(value) => setEditingSupplier({ ...editingSupplier, document: value })} mask={maskCpfCnpj} />
              <Input label="Telefone" value={editingSupplier.phone || ""} onChange={(value) => setEditingSupplier({ ...editingSupplier, phone: value })} mask={maskPhone} />
            </div>
            <Input label="Contato" value={editingSupplier.contact || ""} onChange={(value) => setEditingSupplier({ ...editingSupplier, contact: value })} />
            <Input label="Observação" value={editingSupplier.note || ""} onChange={(value) => setEditingSupplier({ ...editingSupplier, note: value })} />
            <button type="submit" disabled={saving} className="rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              Salvar fornecedor
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
