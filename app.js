// Racking Inventory App
// Stores all data in the browser with localStorage.
// Works as a static GitHub Pages website.

const STORAGE_KEY = "rackingInventoryApp.v1";

let state = loadState();

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function todayText() {
  return new Date().toLocaleDateString();
}

function makeInvoiceNumber() {
  const next = (state.nextInvoiceNumber || 10001);
  state.nextInvoiceNumber = next + 1;
  return `INV-${next}`;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  return {
    locations: STARTING_LOCATIONS,
    parts: STARTING_PARTS.map((part, index) => ({
      id: `part-${index + 1}`,
      rackingType: part.rackingType,
      name: part.name.trim(),
      startingQuantity: Number(part.startingQuantity || 0),
      currentQuantity: Number(part.startingQuantity || 0),
      costEach: Number(part.costEach || 0),
      lowStockThreshold: 5
    })),
    invoices: [],
    movements: [],
    nextInvoiceNumber: 10001
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function qs(id) {
  return document.getElementById(id);
}

function renderAll() {
  renderSelects();
  renderDashboard();
  renderInventoryTable();
  renderInvoiceHistory();
}

function renderSelects() {
  const location = qs("location");
  const rackingType = qs("rackingType");
  const part = qs("part");

  location.innerHTML = state.locations.map(loc => `<option value="${escapeHtml(loc)}">${escapeHtml(loc)}</option>`).join("");

  const types = [...new Set(state.parts.map(p => p.rackingType))];
  rackingType.innerHTML = types.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("");

  const selectedType = rackingType.value || types[0];
  const filtered = state.parts.filter(p => p.rackingType === selectedType);
  part.innerHTML = filtered.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
  updatePartInfo();
}

function updatePartList() {
  const selectedType = qs("rackingType").value;
  const filtered = state.parts.filter(p => p.rackingType === selectedType);
  qs("part").innerHTML = filtered.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
  updatePartInfo();
}

function updatePartInfo() {
  const selectedPart = state.parts.find(p => p.id === qs("part").value);
  if (!selectedPart) {
    qs("partInfo").textContent = "";
    return;
  }
  qs("partInfo").textContent = `Current Qty: ${selectedPart.currentQuantity} | Cost Each: ${money(selectedPart.costEach)}`;
}

function renderDashboard() {
  const totalItems = state.parts.length;
  const totalQty = state.parts.reduce((sum, p) => sum + Number(p.currentQuantity || 0), 0);
  const totalValue = state.parts.reduce((sum, p) => sum + Number(p.currentQuantity || 0) * Number(p.costEach || 0), 0);
  const lowStock = state.parts.filter(p => Number(p.currentQuantity || 0) <= Number(p.lowStockThreshold || 0)).length;
  const invoiceTotal = state.invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  qs("dashboard").innerHTML = `
    <div class="card"><span>Part Types</span><strong>${totalItems}</strong></div>
    <div class="card"><span>Current Quantity</span><strong>${totalQty}</strong></div>
    <div class="card"><span>Inventory Value</span><strong>${money(totalValue)}</strong></div>
    <div class="card alert"><span>Low Stock Items</span><strong>${lowStock}</strong></div>
    <div class="card"><span>Invoice Total</span><strong>${money(invoiceTotal)}</strong></div>
  `;
}

function renderInventoryTable() {
  const rows = state.parts.map(p => {
    const value = Number(p.currentQuantity || 0) * Number(p.costEach || 0);
    const low = Number(p.currentQuantity || 0) <= Number(p.lowStockThreshold || 0);
    return `
      <tr class="${low ? "low-stock" : ""}">
        <td>${escapeHtml(p.rackingType)}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${p.startingQuantity}</td>
        <td>${p.currentQuantity}</td>
        <td>${money(p.costEach)}</td>
        <td>${money(value)}</td>
        <td>${low ? "Low Stock" : "OK"}</td>
      </tr>
    `;
  }).join("");

  qs("inventoryBody").innerHTML = rows;
}

function renderInvoiceHistory() {
  if (!state.invoices.length) {
    qs("invoiceHistory").innerHTML = `<p class="muted">No invoices created yet.</p>`;
    return;
  }

  qs("invoiceHistory").innerHTML = state.invoices.map(inv => `
    <div class="invoice-row">
      <div>
        <strong>${escapeHtml(inv.invoiceNumber)}</strong>
        <span>${escapeHtml(inv.location)} | ${escapeHtml(inv.date)}</span>
      </div>
      <div>
        <strong>${money(inv.total)}</strong>
        <button onclick="downloadInvoicePdf('${inv.invoiceNumber}')">PDF</button>
      </div>
    </div>
  `).join("");
}

function useInventory(event) {
  event.preventDefault();

  const selectedPart = state.parts.find(p => p.id === qs("part").value);
  const qtyUsed = Number(qs("quantityUsed").value || 0);

  if (!selectedPart) return showMessage("Please select a part.", true);
  if (qtyUsed <= 0) return showMessage("Quantity used must be greater than zero.", true);

  if (qtyUsed > Number(selectedPart.currentQuantity || 0)) {
    return showMessage("Not Enough Inventory", true);
  }

  const beforeQty = Number(selectedPart.currentQuantity || 0);
  const afterQty = beforeQty - qtyUsed;
  selectedPart.currentQuantity = afterQty;

  const invoiceNumber = makeInvoiceNumber();
  const total = qtyUsed * Number(selectedPart.costEach || 0);

  const invoice = {
    invoiceNumber,
    date: todayText(),
    location: qs("location").value,
    rackingType: selectedPart.rackingType,
    partId: selectedPart.id,
    partName: selectedPart.name,
    quantityUsed: qtyUsed,
    costEach: Number(selectedPart.costEach || 0),
    total
  };

  state.invoices.unshift(invoice);
  state.movements.unshift({
    date: todayText(),
    type: "USED",
    invoiceNumber,
    partId: selectedPart.id,
    beforeQty,
    quantityChange: -qtyUsed,
    afterQty
  });

  saveState();
  renderAll();
  qs("quantityUsed").value = "";
  showMessage(`Invoice ${invoiceNumber} created. Inventory updated.`, false);
  downloadInvoicePdf(invoiceNumber);
}

function addInventory(event) {
  event.preventDefault();

  const selectedPart = state.parts.find(p => p.id === qs("addPart").value);
  const qtyAdded = Number(qs("quantityAdded").value || 0);

  if (!selectedPart) return showMessage("Please select a part to add inventory.", true);
  if (qtyAdded <= 0) return showMessage("Quantity added must be greater than zero.", true);

  const beforeQty = Number(selectedPart.currentQuantity || 0);
  selectedPart.currentQuantity = beforeQty + qtyAdded;
  state.movements.unshift({
    date: todayText(),
    type: "ADDED",
    invoiceNumber: "",
    partId: selectedPart.id,
    beforeQty,
    quantityChange: qtyAdded,
    afterQty: selectedPart.currentQuantity
  });

  saveState();
  renderAll();
  populateAddInventorySelect();
  qs("quantityAdded").value = "";
  showMessage("Inventory added successfully.", false);
}

function populateAddInventorySelect() {
  qs("addPart").innerHTML = state.parts.map(p => `<option value="${p.id}">${escapeHtml(p.rackingType)} - ${escapeHtml(p.name)}</option>`).join("");
}

function downloadInvoicePdf(invoiceNumber) {
  const invoice = state.invoices.find(inv => inv.invoiceNumber === invoiceNumber);
  if (!invoice) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Racking Inventory Invoice", 14, 20);

  doc.setFontSize(11);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 14, 32);
  doc.text(`Date: ${invoice.date}`, 14, 40);
  doc.text(`Location: ${invoice.location}`, 14, 48);

  doc.autoTable({
    startY: 60,
    head: [["Racking Type", "Item / Part", "Qty Used", "Cost Each", "Total"]],
    body: [[
      invoice.rackingType,
      invoice.partName,
      invoice.quantityUsed,
      money(invoice.costEach),
      money(invoice.total)
    ]]
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text(`Invoice Total: ${money(invoice.total)}`, 14, finalY);

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

function resetDemoData() {
  if (!confirm("Reset all inventory and invoices? This cannot be undone.")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  renderAll();
  populateAddInventorySelect();
  showMessage("Data reset complete.", false);
}

function showMessage(message, isError) {
  const box = qs("message");
  box.textContent = message;
  box.className = isError ? "message error" : "message success";
  setTimeout(() => {
    box.textContent = "";
    box.className = "message";
  }, 4000);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

document.addEventListener("DOMContentLoaded", () => {
  qs("rackingType").addEventListener("change", updatePartList);
  qs("part").addEventListener("change", updatePartInfo);
  qs("usageForm").addEventListener("submit", useInventory);
  qs("addInventoryForm").addEventListener("submit", addInventory);
  qs("resetButton").addEventListener("click", resetDemoData);

  renderAll();
  populateAddInventorySelect();
});
