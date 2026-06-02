import { useState } from "react";
import { ArrowLeft, Edit3, PackagePlus, Save, Trash2 } from "lucide-react";
import { Badge, Input, Line, Modal, Panel, TableWrap } from "../components/ui";
import { formatMoney, initialProductForm } from "../lib/storeData";
import { maskCurrency } from "../lib/validation";

function moneyInput(value) {
  if (value === "" || value === undefined || value === null) return "";
  return Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProdutosPage({
  productForm,
  setProductForm,
  productFilter,
  setProductFilter,
  filteredProducts,
  saving,
  handleProductSubmit,
  deleteProduct,
  errors,
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [view, setView] = useState("list");
  const [imageLoading, setImageLoading] = useState(false);

  function startNew() {
    setProductForm(initialProductForm);
    setSelectedProduct(null);
    setView("form");
  }

  function startEdit(product) {
    setProductForm({
      ...product,
      price: moneyInput(product.price),
      cost: moneyInput(product.cost),
      stock: Number(product.stock || 0),
      minStock: Number(product.minStock || 0),
    });
    setSelectedProduct(null);
    setView("form");
  }

  async function submitProduct(event) {
    const ok = await handleProductSubmit(event);
    if (ok) setView("list");
  }

  async function handleImageFile(file) {
    if (!file) return;
    setImageLoading(true);
    const imageUrl = await resizeImageFile(file);
    setProductForm({ ...productForm, imageUrl });
    setImageLoading(false);
  }

  if (view === "form") {
    return (
      <Panel
        title={productForm.id ? "Editar produto" : "Novo produto"}
        actions={
          <button type="button" onClick={() => setView("list")} className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-black text-neutral-700">
            <ArrowLeft size={16} /> Voltar
          </button>
        }
      >
        <form className="grid gap-5" onSubmit={submitProduct}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Input label="SKU" value={productForm.sku} onChange={(value) => setProductForm({ ...productForm, sku: value })} />
            <Input label="Produto" required value={productForm.name} onChange={(value) => setProductForm({ ...productForm, name: value })} error={errors.productName} />
            <Input label="Categoria" value={productForm.category} onChange={(value) => setProductForm({ ...productForm, category: value })} />
            <Input label="Marca" value={productForm.brand} onChange={(value) => setProductForm({ ...productForm, brand: value })} />
            <Input label="Compatibilidade" value={productForm.compatible} onChange={(value) => setProductForm({ ...productForm, compatible: value })} />
            <Input label="Fornecedor" value={productForm.supplier} onChange={(value) => setProductForm({ ...productForm, supplier: value })} />
            <Input label="URL da imagem" value={productForm.imageUrl || ""} onChange={(value) => setProductForm({ ...productForm, imageUrl: value })} placeholder="https://..." />
            <label className="min-w-0 text-sm font-bold text-neutral-700">
              Imagem do computador
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleImageFile(event.target.files?.[0])}
                className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-sky-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
              {imageLoading && <span className="mt-1 block text-xs font-bold text-sky-600">Preparando imagem...</span>}
            </label>
            <Input label="Estoque inicial" type="number" value={productForm.stock} onChange={(value) => setProductForm({ ...productForm, stock: value })} />
            <Input label="Estoque mínimo" type="number" value={productForm.minStock} onChange={(value) => setProductForm({ ...productForm, minStock: value })} />
            <Input label="Preço de venda" value={productForm.price} onChange={(value) => setProductForm({ ...productForm, price: value })} mask={maskCurrency} />
            <Input label="Custo" value={productForm.cost} onChange={(value) => setProductForm({ ...productForm, cost: value })} mask={maskCurrency} />
          </div>
          {productForm.imageUrl && (
            <div className="w-fit rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="mb-2 text-xs font-black uppercase text-neutral-500">Prévia da imagem</p>
              <img src={productForm.imageUrl} alt="Prévia do produto" className="h-32 w-32 rounded-lg bg-white object-contain" />
              <button type="button" onClick={() => setProductForm({ ...productForm, imageUrl: "" })} className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-700">
                Remover imagem
              </button>
            </div>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              <Save size={16} /> Salvar produto
            </button>
          </div>
        </form>
      </Panel>
    );
  }

  return (
    <div className="grid gap-5">
      <Panel
        title="Produtos"
        actions={
          <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-black text-white">
            <PackagePlus size={16} /> Novo produto
          </button>
        }
      >
        <div className="mb-4">
          <Input label="Buscar produto" value={productFilter} onChange={setProductFilter} placeholder="Buscar por nome, SKU, categoria, modelo ou fornecedor" />
        </div>
        <TableWrap>
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Compatibilidade</th>
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {filteredProducts.map((product) => (
                <tr key={product.id} onClick={() => setSelectedProduct(product)} className="cursor-pointer transition hover:bg-sky-50/60">
                  <td className="px-4 py-3">
                    <p className="font-black">{product.name}</p>
                    <p className="text-xs text-neutral-500">{product.sku || "Sem SKU"}</p>
                  </td>
                  <td className="px-4 py-3"><Badge tone="sky">{product.category || "Sem categoria"}</Badge></td>
                  <td className="px-4 py-3 text-neutral-600">{product.compatible || "-"}</td>
                  <td className="px-4 py-3 text-neutral-600">{product.supplier || "-"}</td>
                  <td className="px-4 py-3 font-black">{formatMoney(product.price)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700">Abrir</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>

      <Modal title="Detalhes do produto" open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)}>
        {selectedProduct && (
          <div className="grid gap-4">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xl font-black">{selectedProduct.name}</p>
              <p className="text-sm font-semibold text-neutral-500">{selectedProduct.sku || "Sem SKU"} · {selectedProduct.category || "Sem categoria"}</p>
            </div>
            <div className="grid gap-2">
              <Line label="Marca" value={selectedProduct.brand || "-"} />
              <Line label="Compatibilidade" value={selectedProduct.compatible || "-"} />
              <Line label="Fornecedor" value={selectedProduct.supplier || "-"} />
              <Line label="Imagem" value={selectedProduct.imageUrl ? "Cadastrada" : "Sem imagem"} />
              <Line label="Estoque cadastrado" value={`${selectedProduct.stock || 0} un`} />
              <Line label="Estoque mínimo" value={`${selectedProduct.minStock || 0} un`} />
              <Line label="Preço de venda" value={formatMoney(selectedProduct.price)} />
              <Line label="Custo" value={formatMoney(selectedProduct.cost)} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => startEdit(selectedProduct)} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-black text-white">
                <Edit3 size={16} /> Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(selectedProduct.id);
                  setSelectedProduct(null);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-black text-white"
              >
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxSize = 640;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
