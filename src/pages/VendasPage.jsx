import { useState } from "react";
import { Badge, Line, Metric, Modal, Panel, TableWrap } from "../components/ui";
import { formatMoney } from "../lib/storeData";
import { printSaleReceipt } from "../lib/printing";

const paymentLabels = {
  Dinheiro: "Dinheiro",
  Pix: "PIX",
  "Cartao credito": "Cartão crédito",
  "Cartao debito": "Cartão débito",
  Boleto: "Boleto",
  Transferencia: "Transferência",
  "Vale/Credito": "Vale/Crédito",
  Crediario: "Crediário",
};

function dateLabel(value) {
  if (value?.toDate) return value.toDate().toLocaleString("pt-BR");
  return value || "-";
}

export function VendasPage({
  metrics,
  tenant,
  orders,
  filteredOrders,
  orderFilter,
  setOrderFilter,
  updateOrderStatus,
  deleteOrder,
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const validOrders = orders.filter((order) => order.status !== "Cancelado");
  const canceledOrders = orders.filter((order) => order.status === "Cancelado").length;

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-4">
        <Metric title="Vendas válidas" value={validOrders.length} detail="Sem canceladas" tone="sky" />
        <Metric title="Faturamento" value={formatMoney(metrics.revenueTotal)} detail="Total vendido" tone="emerald" />
        <Metric title="Ticket médio" value={formatMoney(metrics.averageTicket)} detail="Por venda" tone="amber" />
        <Metric title="Canceladas" value={canceledOrders} detail="Histórico de vendas" tone={canceledOrders ? "danger" : "neutral"} />
      </div>

      <Panel title="Vendas" actions={<span className="text-sm font-bold text-neutral-500">{orders.length} registros</span>}>
        <div className="mb-4 flex flex-wrap gap-2">
          {["Todos", "Finalizado", "Em atendimento", "Cancelado"].map((status) => (
            <button key={status} type="button" onClick={() => setOrderFilter(status)} className={`rounded-lg px-3 py-2 text-xs font-black ${orderFilter === status ? "bg-neutral-950 text-white" : "border border-neutral-300 bg-white text-neutral-600"}`}>
              {status}
            </button>
          ))}
        </div>
        <TableWrap>
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Itens</th>
                <th className="px-4 py-3">Pagamentos</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Lucro</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {filteredOrders.map((order) => (
                <tr key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer transition hover:bg-sky-50/60">
                  <td className="px-4 py-3">
                    <p className="font-black">{order.customer || "Cliente balcão"}</p>
                    <p className="text-xs text-neutral-500">{order.phone || "Sem telefone"}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {(order.items || []).map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {(order.payments?.length ? order.payments : [{ method: order.payment, amount: order.total }])
                      .map((item) => `${paymentLabels[item.method] || item.method || "Não informado"}: ${formatMoney(item.amount)}`).join(" | ")}
                    {Number(order.change || 0) > 0 && <p className="text-xs font-bold text-emerald-700">Troco: {formatMoney(order.change)}</p>}
                    {Number(order.creditGenerated || 0) > 0 && <p className="text-xs font-bold text-sky-700">Crédito: {formatMoney(order.creditGenerated)}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={order.status === "Cancelado" ? "danger" : order.status === "Em atendimento" ? "amber" : "success"}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3 font-black">{formatMoney(order.profit)}</td>
                  <td className="px-4 py-3 font-black">{formatMoney(order.total)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-neutral-500">{dateLabel(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700">Abrir</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>

      <Modal title="Detalhes da venda" open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <div className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-3">
              <Metric title="Cliente" value={selectedOrder.customer || "Balcão"} detail={selectedOrder.phone || "Sem telefone"} tone="neutral" />
              <Metric title="Total" value={formatMoney(selectedOrder.total)} detail={`Lucro ${formatMoney(selectedOrder.profit)}`} tone="emerald" />
              <Metric title="Status" value={selectedOrder.status} detail={dateLabel(selectedOrder.createdAt)} tone={selectedOrder.status === "Cancelado" ? "danger" : "sky"} />
            </div>
            <Panel title="Cliente">
              <div className="space-y-2">
                <Line label="Venda" value={selectedOrder.orderNumber ? `Venda #${selectedOrder.orderNumber}` : selectedOrder.code || selectedOrder.id || "-"} />
                <Line label="Nome" value={selectedOrder.customer || "Cliente balcão"} />
                <Line label="CPF/CNPJ" value={selectedOrder.customerDocument || selectedOrder.document || "-"} />
                <Line label="Telefone" value={selectedOrder.phone || "-"} />
              </div>
            </Panel>
            <Panel title="Itens">
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item, index) => (
                  <Line key={`${item.id}-${index}`} label={`${item.quantity}x ${item.name}`} value={formatMoney(item.price * item.quantity)} />
                ))}
              </div>
            </Panel>
            <Panel title="Pagamentos">
              <div className="space-y-2">
                {(selectedOrder.payments?.length ? selectedOrder.payments : [{ method: selectedOrder.payment, amount: selectedOrder.total }]).map((item, index) => (
                  <Line key={`${item.method}-${index}`} label={paymentLabels[item.method] || item.method || "Não informado"} value={formatMoney(item.amount)} />
                ))}
                {Number(selectedOrder.change || 0) > 0 && <Line label="Troco" value={formatMoney(selectedOrder.change)} />}
                {Number(selectedOrder.creditGenerated || 0) > 0 && <Line label="Crédito gerado" value={formatMoney(selectedOrder.creditGenerated)} />}
              </div>
            </Panel>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => printSaleReceipt({ sale: selectedOrder, store: tenant, title: "Comprovante de venda", duplicate: true })}
                className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white"
              >
                2ª via / PDF
              </button>
              <button type="button" onClick={() => updateOrderStatus(selectedOrder.id, "Finalizado")} className="rounded-lg border border-neutral-300 px-4 py-3 text-sm font-black">Marcar finalizada</button>
              <button type="button" onClick={() => updateOrderStatus(selectedOrder.id, "Em atendimento")} className="rounded-lg border border-amber-200 px-4 py-3 text-sm font-black text-amber-700">Editar status</button>
              <button type="button" onClick={() => updateOrderStatus(selectedOrder.id, "Cancelado")} className="rounded-lg border border-red-200 px-4 py-3 text-sm font-black text-red-700">Cancelar</button>
              {tenant?.allowOrderDelete && (
                <button
                  type="button"
                  onClick={() => {
                    deleteOrder(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                  className="rounded-lg bg-red-600 px-4 py-3 text-sm font-black text-white"
                >
                  Excluir venda
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
