import { getPropertyById, updateProperty } from "./propertyService.js";
import { getUnits, updateUnit, addUnit } from "./unitService.js";
import { onAuthChange } from "./auth.js";

onAuthChange(user => { if (!user) window.location.href = "login.html"; });

const params = new URLSearchParams(window.location.search);
const propId = params.get("id");
if (!propId) window.location.href = "dashboard.html";

const loadingScreen = document.getElementById("loadingScreen");
const propMain = document.getElementById("propMain");
const headerName = document.getElementById("headerPropName");
const headerMeta = document.getElementById("headerMeta");
const propStatusBadge = document.getElementById("propStatusBadge");
const multiView = document.getElementById("multiView");
const singleView = document.getElementById("singleView");
const unitsBar = document.getElementById("unitsBar");
const unitDetail = document.getElementById("unitDetail");
const singleDetail = document.getElementById("singleDetail");

const modalEditUnit = document.getElementById("modalEditUnit");
const editUnitForm = document.getElementById("editUnitForm");
const editUnitClose = document.getElementById("editUnitClose");
const editUnitCancel = document.getElementById("editUnitCancel");
const editUnitTitle = document.getElementById("editUnitTitle");

let currentProp = null;
let currentUnits = [];
let activeUnitId = null;

const TYPE_LABELS = { vivienda: "Vivienda", edificio: "Edificio" };

function createIcons() {
  if (typeof lucide !== "undefined") lucide.createIcons();
  else setTimeout(createIcons, 50);
}

async function init() {
  try {
    const [prop, units] = await Promise.all([ getPropertyById(propId), getUnits(propId) ]);
    if (!prop) { window.location.href = "dashboard.html"; return; }
    currentProp = prop;
    currentUnits = units;
    renderHeader(prop);
    renderContent(prop, units);
    loadingScreen.hidden = true;
    propMain.hidden = false;
    createIcons();
  } catch (err) {
    console.error("Error cargando propiedad:", err);
    loadingScreen.hidden = true;
    propMain.hidden = false;
  }
}

init();

function renderHeader(prop) {
  document.title = `Floast — ${prop.name}`;
  headerName.textContent = prop.name;
  const typeLabel = TYPE_LABELS[prop.type] || prop.type;
  
  let detailHtml = "";
  if (prop.rentMode === "individual") {
    detailHtml = `<i data-lucide="layers"></i>${prop.units} unidades`;
  } else {
    detailHtml = `<i data-lucide="door-closed"></i>${prop.rooms || 0} hab. · ${prop.baths || 0} baños`;
  }

  headerMeta.innerHTML = `
    <span class="header-meta-item"><i data-lucide="tag"></i>${typeLabel} (${capitalize(prop.rentMode)})</span>
    <span class="header-meta-item"><i data-lucide="map-pin"></i>${prop.location}</span>
    <span class="header-meta-item">${detailHtml}</span>
  `;
  propStatusBadge.textContent = capitalize(prop.status);
  propStatusBadge.dataset.status = prop.status;
}

function renderContent(prop, units) {
  const isSingle = prop.rentMode === "completa";
  if (isSingle) {
    multiView.hidden = true;
    singleView.hidden = false;
    const unit = units[0] || synthUnit(prop);
    singleDetail.innerHTML = buildDetailHTML(unit, prop);
    bindDetailActions(singleDetail, unit);
  } else {
    multiView.hidden = false;
    singleView.hidden = true;
    renderUnitsBar(units);
    if (units.length > 0) selectUnit(units[0].id);
  }
}

function renderUnitsBar(units) {
  unitsBar.innerHTML = `<span class="units-bar-label">Unidades</span>`;
  units.forEach(unit => {
    const tab = document.createElement("button");
    tab.className = "unit-tab";
    tab.dataset.id = unit.id;
    tab.dataset.status = unit.status;
    tab.setAttribute("role", "tab");
    tab.innerHTML = `<span class="tab-dot"></span>${unit.label}`;
    tab.addEventListener("click", () => selectUnit(unit.id));
    unitsBar.appendChild(tab);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "unit-tab";
  addBtn.style.borderStyle = "dashed";
  addBtn.innerHTML = `<i data-lucide="plus" style="width:14px; height:14px; margin-right:4px;"></i> Agregar`;
  addBtn.addEventListener("click", () => {
    document.getElementById("editUnitId").value = ""; 
    document.getElementById("eUnitLabel").value = `Unidad ${units.length + 1}`;
    document.getElementById("eUnitStatus").value = "disponible";
    document.getElementById("eUnitPrice").value = currentProp.price;
    editUnitTitle.textContent = "Nueva Unidad";
    showModal(modalEditUnit);
  });
  unitsBar.appendChild(addBtn);
}

function selectUnit(unitId) {
  activeUnitId = unitId;
  unitsBar.querySelectorAll(".unit-tab").forEach(tab => {
    const isActive = tab.dataset.id === unitId;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive);
  });
  const unit = currentUnits.find(u => u.id === unitId);
  if (!unit) return;
  unitDetail.innerHTML = "";
  unitDetail.insertAdjacentHTML("beforeend", buildDetailHTML(unit, currentProp));
  bindDetailActions(unitDetail, unit);
  lucide.createIcons();
}

function buildDetailHTML(unit, prop) {
  const priceFormatted = Number(unit.price || prop.price).toLocaleString("es-MX");
  const hasTenant = unit.tenant?.name;
  const isCompleta = prop.rentMode === "completa";
  const displayNotes = unit.notes || prop.notes; // Unificado: usa las notas de la unidad o de la propiedad
  
  return `
    <div class="detail-grid">
      <div class="detail-card">
        <div class="detail-card-header">
          <span class="detail-card-title"><i data-lucide="home"></i>Resumen</span>
          <button class="card-edit-btn" data-action="edit-unit" data-id="${unit.id}">
            <i data-lucide="pencil"></i> Editar
          </button>
        </div>
        <div class="summary-row">
          <span class="summary-price">$${priceFormatted}</span>
          <span class="summary-price-sub">/ mes</span>
        </div>
        <span class="unit-status-badge" data-status="${unit.status}">
          <span class="dot"></span>${capitalize(unit.status)}
        </span>
        <div class="detail-data-list" style="margin-top:1rem">
          ${!isCompleta ? `
          <div class="detail-data-row">
            <span class="detail-data-label"><i data-lucide="hash"></i>Identificador</span>
            <span class="detail-data-value">${unit.label}</span>
          </div>` : ""}
        </div>
      </div>

      <div class="detail-card">
        <div class="detail-card-header">
          <span class="detail-card-title"><i data-lucide="user"></i>Inquilino</span>
          <button class="card-edit-btn" data-action="edit-unit" data-id="${unit.id}">
            <i data-lucide="pencil"></i> Editar
          </button>
        </div>
        ${hasTenant ? `
          <div class="tenant-header-row">
            <div class="tenant-avatar">${getInitials(unit.tenant.name)}</div>
            <div>
              <p class="tenant-name">${unit.tenant.name}</p>
              ${unit.tenant.leaseEnd ? `<p class="tenant-since">Contrato hasta: ${formatDate(unit.tenant.leaseEnd)}</p>` : ""}
            </div>
          </div>
          <div class="detail-data-list">
            ${unit.tenant.phone ? `<div class="detail-data-row"><span class="detail-data-label"><i data-lucide="phone"></i>Teléfono</span><span class="detail-data-value">${unit.tenant.phone}</span></div>` : ""}
            ${unit.tenant.email ? `<div class="detail-data-row"><span class="detail-data-label"><i data-lucide="mail"></i>Correo</span><span class="detail-data-value">${unit.tenant.email}</span></div>` : ""}
          </div>
        ` : `
          <div class="tenant-empty"><i data-lucide="user-x"></i><p>Sin inquilino asignado</p></div>
        `}
      </div>

      ${displayNotes ? `
      <div class="detail-card full-width">
        <div class="detail-card-header">
          <span class="detail-card-title"><i data-lucide="file-text"></i>Notas Adicionales</span>
        </div>
        <p class="notes-text">${displayNotes}</p>
      </div>` : ""}
    </div>
  `;
}

function bindDetailActions(container, unit) {
  container.querySelectorAll("[data-action='edit-unit']").forEach(btn => {
    btn.addEventListener("click", () => openEditUnitModal(unit));
  });
}

function openEditUnitModal(unit) {
  editUnitTitle.textContent = `Editar — ${unit.label}`;
  document.getElementById("editUnitId").value = unit.id;
  document.getElementById("eUnitLabel").value = unit.label;
  document.getElementById("eUnitStatus").value = unit.status;
  document.getElementById("eUnitPrice").value = unit.price || "";
  document.getElementById("eTenantName").value = unit.tenant?.name || "";
  document.getElementById("eTenantPhone").value = unit.tenant?.phone || "";
  document.getElementById("eTenantEmail").value = unit.tenant?.email || "";
  document.getElementById("eLeaseEnd").value = unit.tenant?.leaseEnd || "";
  document.getElementById("eUnitNotes").value = unit.notes || "";
  showModal(modalEditUnit);
}

[editUnitClose, editUnitCancel].forEach(b => b.addEventListener("click", () => hideModal(modalEditUnit)));

editUnitForm.addEventListener("submit", async e => {
  e.preventDefault();
  const submitBtn = editUnitForm.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Guardando…";

  const unitId = document.getElementById("editUnitId").value;
  const data = {
    label: document.getElementById("eUnitLabel").value.trim(),
    status: document.getElementById("eUnitStatus").value,
    price: Number(document.getElementById("eUnitPrice").value) || 0,
    notes: document.getElementById("eUnitNotes").value.trim(),
    tenant: {
      name: document.getElementById("eTenantName").value.trim(),
      phone: document.getElementById("eTenantPhone").value.trim(),
      email: document.getElementById("eTenantEmail").value.trim(),
      leaseEnd: document.getElementById("eLeaseEnd").value || null,
    },
  };
  if (!data.tenant.name) data.tenant = null;

  try {
    if (unitId) {
      await updateUnit(propId, unitId, data);
      const idx = currentUnits.findIndex(u => u.id === unitId);
      if (idx !== -1) currentUnits[idx] = { ...currentUnits[idx], ...data };
    } else {
      const newUnit = await addUnit(propId, data);
      currentUnits.push(newUnit);
      await updateProperty(propId, { units: currentUnits.length });
    }

    if (multiView.hidden === false) {
      renderUnitsBar(currentUnits);
      selectUnit(unitId || currentUnits[currentUnits.length - 1].id);
    } else {
      singleDetail.innerHTML = buildDetailHTML(currentUnits[0] || synthUnit(currentProp), currentProp);
      bindDetailActions(singleDetail, currentUnits[0]);
    }
    lucide.createIcons();
    hideModal(modalEditUnit);
  } catch (err) {
    console.error("Error guardando unidad:", err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Guardar Unidad";
  }
});

function showModal(m) { m.hidden = false; document.body.style.overflow = "hidden"; setTimeout(() => m.querySelector("input,select,button")?.focus(), 50); }
function hideModal(m) { m.hidden = true; document.body.style.overflow = ""; }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
function getInitials(name) { return (name || "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(""); }
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}
function synthUnit(prop) {
  // Pasamos las notas de la propiedad a la unidad sintética
  return { id: "synth", label: prop.name, status: prop.status, price: prop.price, tenant: null, notes: prop.notes || "" };
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") { if (!modalEditUnit.hidden) hideModal(modalEditUnit); }
});