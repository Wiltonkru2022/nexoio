import { useState } from "react";
import { Badge, Line, Metric, Modal, Panel, TableWrap } from "../components/ui";
import { formatMoney, getCreatedDate, today } from "../lib/storeData";
import { printItemReport, printSalesReport } from "../lib/printing";

export function RelatoriosPage({ tenant, metrics, orders, products, customers, workOrders, cashMovements }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [dateStart, setDateStart] = useState(today);
  const [dateEnd, setDateEnd] = useState(today);
  const validOrders = orders.filter((order) => {
    if (order.status === "Cancelado") return false;
    const date = getCreatedDate(order);
    if (dateStart && date < dateStart) return false;
    if (dateEnd && date > dateEnd) return false;
    return true;
  });
  const todayOrders = validOrders.filter((order) => getCreatedDate(order) === today);
  const topProducts = validOrders.reduce((acc, order) => {
    (order.items || []).forEach((item) => {
      const key = item.name || item.id;
      acc[key] = acc[key] || { name: item.name, quantity: 0, total: 0 };
      acc[key].quantity += Number(item.quantity || 0);
      acc[key].total += Number(item.price || 0) * Number(item.quantity || 0);
    });
    return acc;
  }, {});
  const bestSellers = Object.values(topProducts).sort((a, b) => b.total - a.total).slice(0, 8);
  const receivable = orders.filter((order) => order.status === "Em atendimento").reduce((sum, order) => sum + Number(order.total || 0), 0);
  const withdrawals = cashMovements.filter((item) => item.type === "withdrawal").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const periodRevenue = validOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const periodProfit = validOrders.reduce((sum, order) => sum + Number(order.profit || 0), 0);
  const technicianCommissions = workOrders.reduce((acc, order) => {
    const name = order.technicianName || order.technicianUid || "Sem técnico";
    const base = Number(order.estimate || 0);
    acc[name] = (acc[name] || 0) + base * 0.1;
    return acc;
  }, {});

  function exportCsv() {
    const rows = [
      ["Data", "Cliente", "Status", "Total", "Lucro"],
      ...validOrders.map((order) => [getCreatedDate(order), order.customer || "Cliente balcão", order.status, order.total || 0, order.profit || 0]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-nexo-${dateStart}-${dateEnd}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Relatórios</h2>
          <p className="text-sm font-semibold text-slate-500">Resumo operacional e financeiro da loja.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" />
          <input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" />
          <button type="button" onClick={exportCsv} className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => printSalesReport({
              store: tenant,
              orders: validOrders,
              summary: {
                period: `Período: ${dateStart || "-"} até ${dateEnd || "-"}`,
                revenue: periodRevenue,
                profit: periodProfit,
              },
            })}
            className="rounded-lg bg-neutral-950 px-5 py-3 text-sm font-black text-white"
          >
            Imprimir/PDF
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric title="Vendas hoje" value={formatMoney(metrics.revenueToday)} detail={`${todayOrders.length} vendas`} tone="sky" />
        <Metric title="Faturamento período" value={formatMoney(periodRevenue)} detail={`${validOrders.length} vendas`} tone="sky" />
        <Metric title="Lucro período" value={formatMoney(periodProfit)} detail="Estimado" tone="emerald" />
        <Metric title="A receber" value={formatMoney(receivable)} detail="Em atendimento" tone="amber" />
        <Metric title="Clientes" value={customers.length} detail="Base cadastrada" tone="neutral" />
        <Metric title="Sangrias" value={formatMoney(withdrawals)} detail="Saidas de caixa" tone="danger" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel title="Produtos e serviços mais vendidos">
          <TableWrap>
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Qtd</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {bestSellers.map((item) => (
                  <tr key={item.name} onClick={() => setSelectedItem(item)} className="cursor-pointer transition hover:bg-sky-50/60">
                    <td className="px-4 py-3 font-black">{item.name}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3 font-black">{formatMoney(item.total)}</td>
                  </tr>
                ))}
                {!bestSellers.length && <tr><td colSpan="3" className="px-4 py-8 text-center font-bold text-neutral-500">Sem vendas para analisar.</td></tr>}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        <div className="space-y-5">
          <Panel title="Alertas operacionais">
            <div className="space-y-3">
              <Line label="Estoque baixo" value={`${metrics.lowStock.length} itens`} />
              <Line label="OS abertas" value={metrics.openOs} />
              <Line label="Itens vendidos hoje" value={metrics.itemsSoldToday || 0} />
              <Line label="Produtos cadastrados" value={products.length} />
            </div>
          </Panel>

          <Panel title="Comissão técnica sugerida">
            <div className="space-y-2">
              {Object.entries(technicianCommissions).map(([name, amount]) => (
                <Line key={name} label={name} value={formatMoney(amount)} />
              ))}
              {!Object.keys(technicianCommissions).length && <p className="text-sm font-bold text-neutral-500">Nenhuma OS no período.</p>}
            </div>
          </Panel>

          <Panel title="Status da assistência">
            <div className="space-y-2">
              {["Orcamento", "Aguardando peca", "Em reparo", "Pronto", "Entregue"].map((status) => {
                const count = workOrders.filter((item) => item.status === status).length;
                return <Line key={status} label={status} value={count} />;
              })}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Ultimas vendas">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {orders.slice(0, 9).map((order) => (
            <div key={order.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black">{order.customer || "Cliente balcao"}</p>
                  <p className="text-sm font-semibold text-neutral-500">{getCreatedDate(order) || "Sem data"}</p>
                </div>
                <Badge tone={order.status === "Cancelado" ? "danger" : order.status === "Em atendimento" ? "amber" : "success"}>{order.status}</Badge>
              </div>
              <p className="mt-4 text-2xl font-black text-sky-700">{formatMoney(order.total)}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Modal title="Detalhes do item" open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <div className="grid gap-4">
            <Metric title="Item" value={selectedItem.name} detail="Produto ou serviço vendido" tone="sky" />
            <div className="grid gap-2">
              <Line label="Quantidade vendida" value={selectedItem.quantity} />
              <Line label="Total vendido" value={formatMoney(selectedItem.total)} />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => printItemReport({ store: tenant, item: selectedItem })} className="rounded-lg bg-neutral-950 px-4 py-3 text-sm font-black text-white">
                Imprimir
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
