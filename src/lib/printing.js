import { formatMoney, getCreatedDate } from "./storeData";

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

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

export function dateLabel(value) {
  if (value?.toDate) return value.toDate().toLocaleString("pt-BR");
  if (value) return String(value);
  return new Date().toLocaleString("pt-BR");
}

function storeAddress(store = {}) {
  return [store.street, store.number, store.neighborhood, store.city, store.state].filter(Boolean).join(", ");
}

function storeHeader(store = {}, fallbackName = "Nexo.io") {
  const name = store?.name || fallbackName || "Nexo.io";
  const contact = store?.whatsapp || store?.phone || "";
  const address = storeAddress(store);
  return `
    <header class="store-head">
      ${store?.logoUrl ? `<img class="store-logo" src="${escapeHtml(store.logoUrl)}" alt="${escapeHtml(name)}" />` : ""}
      <h1>${escapeHtml(name)}</h1>
      ${store?.document ? `<p>CNPJ/CPF: ${escapeHtml(store.document)}</p>` : ""}
      ${contact ? `<p>WhatsApp/Telefone: ${escapeHtml(contact)}</p>` : ""}
      ${address ? `<p>${escapeHtml(address)}</p>` : ""}
    </header>
  `;
}

function openPrintDocument(html) {
  const printWindow = window.open("", "_blank", "width=520,height=760");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function paymentLabel(payment) {
  const base = paymentLabels[payment.method] || payment.method || "Não informado";
  const installments = Number(payment.installments || 1) > 1 ? ` em ${payment.installments}x` : "";
  const provider = payment.provider ? ` - ${payment.provider}` : "";
  const dueDate = payment.dueDate ? ` - venc. ${new Date(`${payment.dueDate}T00:00:00`).toLocaleDateString("pt-BR")}` : "";
  return `${base}${installments}${provider}${dueDate}`;
}

function saleReceiptShell(title, body) {
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page{size:80mm auto;margin:4mm}
          *{box-sizing:border-box}
          body{margin:0;background:#fff;color:#0f172a;font-family:Arial,Helvetica,sans-serif;font-size:11px}
          .receipt{width:72mm;margin:0 auto}
          .store-head{text-align:center;border-bottom:1px dashed #94a3b8;padding-bottom:8px;margin-bottom:8px}
          .store-logo{max-width:34mm;max-height:18mm;object-fit:contain;display:block;margin:0 auto 6px}
          h1{font-size:15px;margin:0 0 3px;font-weight:900}
          h2{font-size:12px;margin:0 0 4px;text-align:center;text-transform:uppercase}
          p{margin:2px 0}.muted{color:#64748b}.center{text-align:center}
          .box{border:1px solid #e2e8f0;border-radius:8px;padding:7px;margin:8px 0;background:#f8fafc}
          .line{border-top:1px dashed #94a3b8;margin:8px 0}
          .row{display:flex;justify-content:space-between;gap:8px;margin:4px 0}
          .row span{min-width:0}.row strong{text-align:right;font-size:12px}
          .items{display:grid;gap:5px}.item-name{font-weight:800}.item-sub{font-size:10px;color:#64748b}
          .total{font-size:15px;font-weight:900}
          .footer{margin-top:10px;text-align:center;border-top:1px dashed #94a3b8;padding-top:8px}
        </style>
      </head>
      <body><main class="receipt">${body}</main><script>window.print();setTimeout(()=>window.close(),700);</script></body>
    </html>`;
}

export function printSaleReceipt({ sale, store, title = "Comprovante de venda", duplicate = false }) {
  if (!sale) return;
  const payments = sale.payments?.length ? sale.payments : [{ method: sale.payment, amount: sale.total }];
  const itemsHtml = (sale.items || []).map((item) => `
    <div>
      <div class="row"><span class="item-name">${escapeHtml(item.quantity || 1)}x ${escapeHtml(item.name)}</span><strong>${formatMoney(Number(item.price || 0) * Number(item.quantity || 1))}</strong></div>
      <div class="item-sub">${escapeHtml(item.sku || item.kind || "")}</div>
    </div>
  `).join("");
  const paymentsHtml = payments.map((item) => `
    <div class="row"><span>${escapeHtml(paymentLabel(item))}</span><strong>${formatMoney(item.amount)}</strong></div>
    ${item.provider ? `<div class="row muted"><span>${escapeHtml(item.provider)}</span><span>${escapeHtml(item.status || "")}</span></div>` : ""}
  `).join("");
  const customerName = sale.customer || "Cliente balcão";
  const customerDocument = sale.customerDocument || sale.document || "";
  const customerPhone = sale.phone || "";
  const saleLabel = sale.orderNumber ? `Venda #${sale.orderNumber}` : sale.code || sale.id || "";
  openPrintDocument(saleReceiptShell(title, `
    ${storeHeader(store, sale.tenant)}
    <h2>${duplicate ? "2ª via do comprovante" : title}</h2>
    <p class="center muted">${escapeHtml(dateLabel(sale.createdAt || sale.date))}</p>
    ${saleLabel ? `<p class="center muted">${escapeHtml(saleLabel)}</p>` : ""}
    <section class="box">
      <div class="row"><span>Cliente</span><strong>${escapeHtml(customerName)}</strong></div>
      ${customerDocument ? `<div class="row"><span>CPF/CNPJ</span><strong>${escapeHtml(customerDocument)}</strong></div>` : ""}
      ${customerPhone ? `<div class="row"><span>Telefone</span><strong>${escapeHtml(customerPhone)}</strong></div>` : ""}
    </section>
    <section class="items">${itemsHtml || "<p class='muted center'>Sem itens.</p>"}</section>
    <div class="line"></div>
    <div class="row"><span>Subtotal</span><strong>${formatMoney(sale.subtotal)}</strong></div>
    <div class="row"><span>Desconto</span><strong>${formatMoney(sale.discount)}</strong></div>
    <div class="row total"><span>Total</span><strong>${formatMoney(sale.total)}</strong></div>
    <div class="line"></div>
    ${paymentsHtml}
    ${Number(sale.change || 0) > 0 ? `<div class="row"><span>Troco</span><strong>${formatMoney(sale.change)}</strong></div>` : ""}
    ${Number(sale.creditGenerated || 0) > 0 ? `<div class="row"><span>Crédito gerado</span><strong>${formatMoney(sale.creditGenerated)}</strong></div>` : ""}
    <p class="footer">${escapeHtml(store?.receiptMessage || "Obrigado pela preferência.")}</p>
  `));
}

function reportShell(title, store, body) {
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page{size:A4;margin:14mm}
          *{box-sizing:border-box}
          body{margin:0;color:#0f172a;font-family:Arial,Helvetica,sans-serif;font-size:12px}
          .store-head{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:18px}
          .store-logo{max-width:96px;max-height:56px;object-fit:contain}
          .store-head h1{margin:0;font-size:22px}.store-head p{margin:2px 0;color:#475569}
          h2{font-size:20px;margin:0 0 10px}.muted{color:#64748b}
          .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}
          .card{border:1px solid #cbd5e1;border-radius:10px;padding:10px;background:#f8fafc}
          .card span{display:block;color:#64748b;font-weight:700;font-size:10px;text-transform:uppercase}.card strong{display:block;margin-top:4px;font-size:16px}
          table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left;vertical-align:top}th{background:#f1f5f9;font-size:10px;text-transform:uppercase;color:#475569}
          .right{text-align:right}.footer{margin-top:18px;border-top:1px solid #e2e8f0;padding-top:8px;color:#64748b;text-align:center}
        </style>
      </head>
      <body>${storeHeader(store)}${body}<p class="footer">Gerado em ${new Date().toLocaleString("pt-BR")}</p><script>window.print();setTimeout(()=>window.close(),700);</script></body>
    </html>`;
}

export function printFinancialReport({ store, accounts, title = "Financeiro" }) {
  const rows = accounts.map((account) => `
    <tr>
      <td><strong>${escapeHtml(account.description)}</strong><br><span class="muted">${escapeHtml(account.note || "Sem observação")}</span></td>
      <td>${account.type === "payable" ? "A pagar" : "A receber"}</td>
      <td>${escapeHtml(account.category || "-")}</td>
      <td>${account.dueDate ? new Date(`${account.dueDate}T00:00:00`).toLocaleDateString("pt-BR") : "-"}</td>
      <td class="right">${formatMoney(account.amount)}</td>
      <td>${account.status === "paid" ? "Pago" : "Aberto"}</td>
    </tr>
  `).join("");
  openPrintDocument(reportShell(title, store, `
    <h2>${escapeHtml(title)}</h2>
    <p class="muted">Contas pagas, a pagar e a receber.</p>
    <table>
      <thead><tr><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Vencimento</th><th class="right">Valor</th><th>Status</th></tr></thead>
      <tbody>${rows || "<tr><td colspan='6'>Nenhuma conta encontrada.</td></tr>"}</tbody>
    </table>
  `));
}

export function printSalesReport({ store, title = "Relatório de vendas", orders, summary }) {
  const rows = orders.map((order) => `
    <tr>
      <td>${escapeHtml(getCreatedDate(order) || dateLabel(order.createdAt))}</td>
      <td><strong>${escapeHtml(order.customer || "Cliente balcão")}</strong><br><span class="muted">${escapeHtml(order.customerDocument || order.document || order.phone || "")}</span></td>
      <td>${escapeHtml(order.status || "-")}</td>
      <td class="right">${formatMoney(order.total)}</td>
      <td class="right">${formatMoney(order.profit)}</td>
    </tr>
  `).join("");
  openPrintDocument(reportShell(title, store, `
    <h2>${escapeHtml(title)}</h2>
    <p class="muted">${escapeHtml(summary?.period || "")}</p>
    <div class="grid">
      <div class="card"><span>Vendas</span><strong>${orders.length}</strong></div>
      <div class="card"><span>Faturamento</span><strong>${formatMoney(summary?.revenue || 0)}</strong></div>
      <div class="card"><span>Lucro</span><strong>${formatMoney(summary?.profit || 0)}</strong></div>
      <div class="card"><span>Ticket médio</span><strong>${formatMoney(orders.length ? Number(summary?.revenue || 0) / orders.length : 0)}</strong></div>
    </div>
    <table>
      <thead><tr><th>Data</th><th>Cliente</th><th>Status</th><th class="right">Total</th><th class="right">Lucro</th></tr></thead>
      <tbody>${rows || "<tr><td colspan='5'>Nenhuma venda encontrada.</td></tr>"}</tbody>
    </table>
  `));
}

export function printItemReport({ store, item }) {
  if (!item) return;
  openPrintDocument(reportShell("Detalhes do item", store, `
    <h2>${escapeHtml(item.name)}</h2>
    <div class="grid">
      <div class="card"><span>Quantidade vendida</span><strong>${escapeHtml(item.quantity)}</strong></div>
      <div class="card"><span>Total vendido</span><strong>${formatMoney(item.total)}</strong></div>
    </div>
  `));
}
