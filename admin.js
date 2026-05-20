// Mc Racking — Admin page logic
// Password-gated. All changes write to Firestore and to the audit_log collection.

// ====== CHANGE THE ADMIN PASSWORD HERE ======================================
const ADMIN_PASSWORD = "McCoys1927";
// ============================================================================

const ADMIN_UNLOCK_KEY = "rackingInventoryApp.adminUnlocked";
const ADMIN_USER_KEY   = "rackingInventoryApp.adminUser";

let adminState = {
  parts: [],
  users: [],
  locations: [],
  auditLog: []
};

// ---------- Helpers --------------------------------------------------------

function qs(id) { return document.getElementById(id); }

function escapeHtml(text) {
  return String(text == null ? "" : text).replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function setConnectionStatus(text, cls) {
  const el = qs("connectionStatus");
  if (!el) return;
  el.textContent = text;
  el.className = "connection-status " + (cls || "");
}

function getAdminUser() {
  return (qs("adminUserName").value || "").trim();
}

function requireAdminUser() {
  if (!getAdminUser()) {
    showAdminMessage("Please select your name from the Admin User dropdown before making changes.", true);
    qs("adminUserName").focus();
    return false;
  }
  return true;
}

function showAdminMessage(text, isError) {
  const box = qs("adminMessage");
  if (!box) return;
  box.textContent = text;
  box.className = isError ? "message error" : "message success";
  setTimeout(() => { box.textContent = ""; box.className = "message"; }, 5000);
}

function formatWhen(ts) {
  if (!ts) return "—";
  // Firestore Timestamp object
  if (ts.toDate) return ts.toDate().toLocaleString();
  if (typeof ts === "number") return new Date(ts).toLocaleString();
  return String(ts);
}

// ---------- Audit log ------------------------------------------------------

async function recordAudit(action, target, details) {
  try {
    await db.collection("audit_log").add({
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      admin: getAdminUser() || "(unknown)",
      action,
      target,
      details: details || {}
    });
  } catch (err) {
    console.error("Audit write failed:", err);
  }
}

// ---------- Password gate --------------------------------------------------

function setupPasswordGate() {
  // Stay unlocked for the session if the user has already entered the password
  if (sessionStorage.getItem(ADMIN_UNLOCK_KEY) === "yes") {
    unlockAdmin();
    return;
  }

  qs("passwordForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const entered = qs("passwordInput").value;
    if (entered === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_UNLOCK_KEY, "yes");
      unlockAdmin();
    } else {
      qs("passwordError").textContent = "Incorrect password.";
      qs("passwordInput").value = "";
      qs("passwordInput").focus();
    }
  });
}

function unlockAdmin() {
  qs("passwordGate").style.display = "none";
  qs("adminApp").style.display = "";
  startAdmin();
}

// ---------- Firestore listeners --------------------------------------------

function attachAdminListeners() {
  db.collection("parts").onSnapshot(snap => {
    adminState.parts = [];
    snap.forEach(d => adminState.parts.push(d.data()));
    adminState.parts.sort((a, b) => {
      const an = Number((a.id || "").replace("part-", "")) || 0;
      const bn = Number((b.id || "").replace("part-", "")) || 0;
      return an - bn;
    });
    renderPartsTable();
    setConnectionStatus("Live", "connected");
  }, err => {
    console.error("Parts listener error:", err);
    setConnectionStatus("Connection error", "error");
  });

  db.collection("settings").doc("users").onSnapshot(doc => {
    adminState.users = (doc.exists && Array.isArray(doc.data().list)) ? doc.data().list.slice() : [];
    renderUsersList();
    populateAdminUserSelect();
  });

  db.collection("settings").doc("locations").onSnapshot(doc => {
    adminState.locations = (doc.exists && Array.isArray(doc.data().list)) ? doc.data().list.slice() : [];
    renderLocationsList();
  });

  db.collection("audit_log").orderBy("timestamp", "desc").limit(500).onSnapshot(snap => {
    adminState.auditLog = [];
    snap.forEach(d => adminState.auditLog.push({ id: d.id, ...d.data() }));
    renderAuditLog();
  });
}

// ---------- Admin user select ----------------------------------------------

function populateAdminUserSelect() {
  const select = qs("adminUserName");
  const previous = select.value;
  const users = adminState.users.slice().sort((a, b) => a.localeCompare(b));
  select.innerHTML = `<option value="">— Select your name —</option>` +
    users.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join("");
  // Restore previous or saved selection
  const saved = localStorage.getItem(ADMIN_USER_KEY);
  if (previous && [...select.options].some(o => o.value === previous)) {
    select.value = previous;
  } else if (saved && [...select.options].some(o => o.value === saved)) {
    select.value = saved;
  }
}

// ---------- PARTS tab ------------------------------------------------------

function renderPartsTable() {
  const body = qs("adminPartsBody");
  if (!adminState.parts.length) {
    body.innerHTML = `<tr><td colspan="7" class="muted" style="text-align:center;padding:20px;">No parts yet. Add one above.</td></tr>`;
    return;
  }
  body.innerHTML = adminState.parts.map(p => `
    <tr data-part-id="${escapeHtml(p.id)}">
      <td><input class="cell-edit" data-field="rackingType" type="text" value="${escapeHtml(p.rackingType || "")}"></td>
      <td><input class="cell-edit" data-field="name" type="text" value="${escapeHtml(p.name || "")}"></td>
      <td><input class="cell-edit" data-field="startingQuantity" type="number" min="0" step="1" value="${Number(p.startingQuantity || 0)}"></td>
      <td><input class="cell-edit" data-field="currentQuantity" type="number" min="0" step="1" value="${Number(p.currentQuantity || 0)}"></td>
      <td><input class="cell-edit" data-field="costEach" type="number" min="0" step="0.01" value="${Number(p.costEach || 0)}"></td>
      <td><input class="cell-edit" data-field="lowStockThreshold" type="number" min="0" step="1" value="${Number(p.lowStockThreshold || 0)}"></td>
      <td>
        <button class="danger" data-action="delete-part">Delete</button>
      </td>
    </tr>
  `).join("");

  // Wire up listeners on edits
  body.querySelectorAll("tr").forEach(tr => {
    const partId = tr.dataset.partId;
    tr.querySelectorAll("input.cell-edit").forEach(inp => {
      inp.addEventListener("change", () => savePartField(partId, inp.dataset.field, inp));
    });
    const delBtn = tr.querySelector('[data-action="delete-part"]');
    if (delBtn) delBtn.addEventListener("click", () => deletePart(partId));
  });
}

async function savePartField(partId, field, input) {
  if (!requireAdminUser()) {
    // Revert the input
    const part = adminState.parts.find(p => p.id === partId);
    if (part) input.value = part[field] != null ? part[field] : "";
    return;
  }

  const part = adminState.parts.find(p => p.id === partId);
  if (!part) return;
  const oldValue = part[field];
  let newValue = input.value;
  if (["startingQuantity", "currentQuantity", "costEach", "lowStockThreshold"].includes(field)) {
    newValue = Number(newValue);
    if (Number.isNaN(newValue)) { input.value = oldValue; return; }
  } else {
    newValue = String(newValue).trim();
    if (!newValue) {
      showAdminMessage(`${field} cannot be empty.`, true);
      input.value = oldValue;
      return;
    }
  }
  if (String(oldValue) === String(newValue)) return;

  try {
    await db.collection("parts").doc(partId).update({ [field]: newValue });
    await recordAudit("EDIT_PART", part.name, {
      partId, field, before: oldValue, after: newValue
    });
    showAdminMessage(`Saved: ${part.name} → ${field}`, false);
  } catch (err) {
    console.error("Save failed:", err);
    showAdminMessage("Save failed: " + err.message, true);
    input.value = oldValue;
  }
}

async function deletePart(partId) {
  if (!requireAdminUser()) return;
  const part = adminState.parts.find(p => p.id === partId);
  if (!part) return;
  if (!confirm(`Delete "${part.name}"?\n\nThis cannot be undone. Invoices that reference this part will keep showing the part's name and price, but the part will no longer appear in inventory.`)) return;

  try {
    await db.collection("parts").doc(partId).delete();
    await recordAudit("DELETE_PART", part.name, { partId, partData: part });
    showAdminMessage(`Deleted: ${part.name}`, false);
  } catch (err) {
    console.error("Delete failed:", err);
    showAdminMessage("Delete failed: " + err.message, true);
  }
}

async function addNewPart(e) {
  e.preventDefault();
  if (!requireAdminUser()) return;

  const rackingType = qs("newPartRackingType").value.trim();
  const name = qs("newPartName").value.trim();
  const startingQuantity = Number(qs("newPartStartingQty").value || 0);
  const costEach = Number(qs("newPartCost").value || 0);
  const lowStockThreshold = Number(qs("newPartThreshold").value || 5);

  if (!rackingType || !name) { showAdminMessage("Racking Type and Item Name are required.", true); return; }

  // Generate new part id: find max numeric suffix among existing part-NN ids, +1
  let maxN = 0;
  adminState.parts.forEach(p => {
    const n = Number((p.id || "").replace("part-", "")) || 0;
    if (n > maxN) maxN = n;
  });
  const newId = `part-${maxN + 1}`;
  const partData = {
    id: newId,
    rackingType,
    name,
    startingQuantity,
    currentQuantity: startingQuantity,
    costEach,
    lowStockThreshold
  };

  try {
    await db.collection("parts").doc(newId).set(partData);
    await recordAudit("ADD_PART", name, { partId: newId, partData });
    qs("addPartForm").reset();
    qs("newPartStartingQty").value = "0";
    qs("newPartCost").value = "0";
    qs("newPartThreshold").value = "5";
    showAdminMessage(`Added part: ${name}`, false);
  } catch (err) {
    console.error("Add part failed:", err);
    showAdminMessage("Add failed: " + err.message, true);
  }
}

// ---------- USERS tab ------------------------------------------------------

function renderUsersList() {
  const ul = qs("adminUsersList");
  if (!adminState.users.length) {
    ul.innerHTML = `<li class="muted">No users yet. Add one above.</li>`;
    return;
  }
  const sorted = adminState.users.slice().sort((a, b) => a.localeCompare(b));
  ul.innerHTML = sorted.map(u => `
    <li>
      <span>${escapeHtml(u)}</span>
      <button class="danger" data-user="${escapeHtml(u)}">Remove</button>
    </li>
  `).join("");
  ul.querySelectorAll("button[data-user]").forEach(btn => {
    btn.addEventListener("click", () => removeUser(btn.dataset.user));
  });
}

async function addUser(e) {
  e.preventDefault();
  if (!requireAdminUser()) return;
  const name = qs("newUserName").value.trim();
  if (!name) return;
  if (adminState.users.includes(name)) {
    showAdminMessage("That user is already on the list.", true);
    return;
  }
  const newList = adminState.users.concat([name]);
  try {
    await db.collection("settings").doc("users").set({ list: newList });
    await recordAudit("ADD_USER", name, { user: name });
    qs("newUserName").value = "";
    showAdminMessage(`Added user: ${name}`, false);
  } catch (err) {
    console.error("Add user failed:", err);
    showAdminMessage("Add failed: " + err.message, true);
  }
}

async function removeUser(name) {
  if (!requireAdminUser()) return;
  if (!confirm(`Remove "${name}" from the user list?\n\nExisting invoices created by this user will still show their name.`)) return;
  const newList = adminState.users.filter(u => u !== name);
  try {
    await db.collection("settings").doc("users").set({ list: newList });
    await recordAudit("REMOVE_USER", name, { user: name });
    showAdminMessage(`Removed user: ${name}`, false);
  } catch (err) {
    console.error("Remove user failed:", err);
    showAdminMessage("Remove failed: " + err.message, true);
  }
}

// ---------- LOCATIONS tab --------------------------------------------------

function renderLocationsList() {
  const ul = qs("adminLocationsList");
  if (!adminState.locations.length) {
    ul.innerHTML = `<li class="muted">No locations yet. Add one above.</li>`;
    return;
  }
  const sorted = adminState.locations.slice().sort();
  ul.innerHTML = sorted.map(loc => `
    <li>
      <span>${escapeHtml(loc)}</span>
      <button class="danger" data-loc="${escapeHtml(loc)}">Remove</button>
    </li>
  `).join("");
  ul.querySelectorAll("button[data-loc]").forEach(btn => {
    btn.addEventListener("click", () => removeLocation(btn.dataset.loc));
  });
}

async function addLocation(e) {
  e.preventDefault();
  if (!requireAdminUser()) return;
  const name = qs("newLocationName").value.trim();
  if (!name) return;
  if (adminState.locations.includes(name)) {
    showAdminMessage("That location is already on the list.", true);
    return;
  }
  const newList = adminState.locations.concat([name]);
  try {
    await db.collection("settings").doc("locations").set({ list: newList });
    await recordAudit("ADD_LOCATION", name, { location: name });
    qs("newLocationName").value = "";
    showAdminMessage(`Added location: ${name}`, false);
  } catch (err) {
    console.error("Add location failed:", err);
    showAdminMessage("Add failed: " + err.message, true);
  }
}

async function removeLocation(name) {
  if (!requireAdminUser()) return;
  if (!confirm(`Remove "${name}" from the location list?\n\nExisting invoices for this location will still show it.`)) return;
  const newList = adminState.locations.filter(l => l !== name);
  try {
    await db.collection("settings").doc("locations").set({ list: newList });
    await recordAudit("REMOVE_LOCATION", name, { location: name });
    showAdminMessage(`Removed location: ${name}`, false);
  } catch (err) {
    console.error("Remove location failed:", err);
    showAdminMessage("Remove failed: " + err.message, true);
  }
}

// ---------- AUDIT tab ------------------------------------------------------

function renderAuditLog() {
  const body = qs("auditBody");
  if (!adminState.auditLog.length) {
    body.innerHTML = `<tr><td colspan="5" class="muted" style="text-align:center;padding:20px;">No admin changes yet.</td></tr>`;
    return;
  }
  body.innerHTML = adminState.auditLog.map(entry => {
    const d = entry.details || {};
    let detailText = "";
    if (entry.action === "EDIT_PART") {
      const beforeVal = d.field === "costEach" ? money(d.before) : escapeHtml(String(d.before));
      const afterVal  = d.field === "costEach" ? money(d.after)  : escapeHtml(String(d.after));
      detailText = `<code>${escapeHtml(d.field)}</code>: ${beforeVal} → ${afterVal}`;
    } else if (entry.action === "ADD_PART") {
      detailText = `Added new part (id ${escapeHtml(d.partId || "")})`;
    } else if (entry.action === "DELETE_PART") {
      detailText = `Deleted part (id ${escapeHtml(d.partId || "")})`;
    } else if (entry.action === "ADD_USER" || entry.action === "REMOVE_USER") {
      detailText = `User: ${escapeHtml(d.user || "")}`;
    } else if (entry.action === "ADD_LOCATION" || entry.action === "REMOVE_LOCATION") {
      detailText = `Location: ${escapeHtml(d.location || "")}`;
    } else {
      detailText = escapeHtml(JSON.stringify(d));
    }
    return `
      <tr>
        <td>${escapeHtml(formatWhen(entry.timestamp))}</td>
        <td>${escapeHtml(entry.admin || "")}</td>
        <td><strong>${escapeHtml(entry.action || "")}</strong></td>
        <td>${escapeHtml(entry.target || "")}</td>
        <td>${detailText}</td>
      </tr>
    `;
  }).join("");
}

// ---------- Tab switching --------------------------------------------------

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const id = "tab-" + btn.dataset.tab;
      qs(id).classList.add("active");
    });
  });
}

// ---------- Boot -----------------------------------------------------------

function startAdmin() {
  setConnectionStatus("Connecting...", "");
  setupTabs();

  qs("addPartForm").addEventListener("submit", addNewPart);
  qs("addUserForm").addEventListener("submit", addUser);
  qs("addLocationForm").addEventListener("submit", addLocation);

  qs("adminUserName").addEventListener("change", () => {
    localStorage.setItem(ADMIN_USER_KEY, getAdminUser());
  });

  attachAdminListeners();
}

document.addEventListener("DOMContentLoaded", () => {
  setupPasswordGate();
});
