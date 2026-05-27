import { getProperties, addProperty, updateProperty, deleteProperty } from "./propertyService.js";
import { generateEmptyUnits } from "./unitService.js";
import { onAuthChange } from "./auth.js";

function createIcons() {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  } else {
    setTimeout(createIcons, 50);
  }
}

onAuthChange((user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const name = user.name || user.displayName || user.email || "Usuario";
  const initials = getInitials(name);
  document.getElementById("userName").textContent = name;
  document.getElementById("avatarInitials").textContent = initials;
});

const grid = document.getElementById("propertiesGrid");
const addCard = document.getElementById("btnAddCard");
const btnNew = document.getElementById("btnNewProperty");
const btnEmptyNew = document.getElementById("btnEmptyNew");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");

const modalProperty = document.getElementById("modalProperty");
const modalTitle = document.getElementById("modalTitle");
const modalClose = document.getElementById("modalClose");
const modalCancel = document.getElementById("modalCancel");
const propertyForm = document.getElementById("propertyForm");
const propIdInput = document.getElementById("propertyId");
const propName = document.getElementById("propName");
const propType = document.getElementById("propType");
const propMode = document.getElementById("propMode");
const propLocation = document.getElementById("propLocation");
const propPrice = document.getElementById("propPrice");
const propStatus = document.getElementById("propStatus");

// Campos dinámicos
const groupRooms = document.getElementById("groupRooms");
const propRooms = document.getElementById("propRooms");
const groupBaths = document.getElementById("groupBaths");
const propBaths = document.getElementById("propBaths");
const groupUnits = document.getElementById("groupUnits");
const propUnits = document.getElementById("propUnits");
const groupNotes = document.getElementById("groupNotes");
const propNotes = document.getElementById("propNotes");

const modalDelete = document.getElementById("modalDelete");
const deleteClose = document.getElementById("deleteClose");
const deleteCancel = document.getElementById("deleteCancel");
const deleteConfirm = document.getElementById("deleteConfirm");
const deletePropName = document.getElementById("deletePropName");

let allProperties = [];
let deleteTargetId = null;

const TYPE_ICONS = {
  vivienda: "house",
  edificio: "building-2",
};

const TYPE_LABELS = {
  vivienda: "Vivienda",
  edificio: "Edificio",
};

async function init() {
  try {
    allProperties = await getProperties();
    renderGrid(allProperties);
  } catch (err) {
    console.error("Error cargando propiedades:", err);
  }
}

init();

// Lógica de mostrar/ocultar campos dinámicos
propMode.addEventListener("change", (e) => {
  const isCompleta = e.target.value === "completa";
  groupRooms.hidden = !isCompleta;
  groupBaths.hidden = !isCompleta;
  groupNotes.hidden = !isCompleta; // Mostramos notas si es completa
  
  groupUnits.hidden = isCompleta;
});

function renderGrid(properties) {
  grid.querySelectorAll(".property-card").forEach(c => c.remove());
  emptyState.hidden = properties.length > 0;
  if (properties.length === 0) {
    addCard.style.display = "flex";
    return;
  }
  addCard.style.display = "flex";
  properties.forEach((prop, index) => {
    const card = buildCard(prop, index);
    grid.insertBefore(card, addCard);
  });
  lucide.createIcons();
}

function buildCard(prop, index) {
  const card = document.createElement("div");
  card.className = "property-card";
  card.dataset.id = prop.id;
  card.style.animationDelay = `${index * 60}ms`;

  const icon = TYPE_ICONS[prop.type] || "building";
  const typeLabel = TYPE_LABELS[prop.type] || prop.type;
  const modeLabel = prop.rentMode === "completa" ? "Completa" : "Individual";
  const unitsLabel = prop.rentMode === "individual" ? `${prop.units} hab.` : `${prop.rooms || 0} hab.`;
  const priceFormatted = Number(prop.price).toLocaleString("es-MX");

  card.innerHTML = `
    <div class="card-illustration" data-type="${prop.type}">
      <i data-lucide="${icon}" class="prop-icon"></i>
      <span class="status-badge" data-status="${prop.status}">${capitalize(prop.status)}</span>
    </div>
    <div class="card-body">
      <p class="card-type">${typeLabel} - ${modeLabel}</p>
      <p class="card-name">${prop.name}</p>
      <div class="card-meta">
        <span class="card-meta-item"><i data-lucide="map-pin"></i>${prop.location}</span>
        <span class="card-meta-item"><i data-lucide="${icon}"></i>${unitsLabel}</span>
      </div>
      <div class="card-footer">
        <p class="card-price">$${priceFormatted}<span>/ mes</span></p>
        <div class="card-actions">
          <button class="card-btn edit-btn" data-id="${prop.id}" title="Editar"><i data-lucide="pencil"></i></button>
          <button class="card-btn danger delete-btn" data-id="${prop.id}" title="Eliminar"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    </div>
  `;

  card.addEventListener("click", (e) => {
    if (e.target.closest(".card-btn")) return;
    window.location.href = `property.html?id=${prop.id}`;
  });

  card.querySelector(".edit-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    openEditModal(prop);
  });

  card.querySelector(".delete-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    openDeleteModal(prop);
  });

  return card;
}

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = allProperties.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.location.toLowerCase().includes(q) ||
    p.type.toLowerCase().includes(q)
  );
  renderGrid(filtered);
});

[btnNew, btnEmptyNew, addCard, btnAddCard].forEach(btn => {
  btn?.addEventListener("click", openNewModal);
});

function openNewModal() {
  propIdInput.value = "";
  propertyForm.reset();
  propMode.dispatchEvent(new Event("change")); 
  clearFormErrors();
  modalTitle.textContent = "Nueva Propiedad";
  document.getElementById("modalSubmit").textContent = "Guardar Propiedad";
  showModal(modalProperty);
}

function openEditModal(prop) {
  propIdInput.value = prop.id;
  propName.value = prop.name;
  propType.value = prop.type;
  propMode.value = prop.rentMode;
  propLocation.value = prop.location;
  propPrice.value = prop.price;
  propStatus.value = prop.status;
  
  propRooms.value = prop.rooms || "";
  propBaths.value = prop.baths || "";
  propUnits.value = prop.units || "";
  propNotes.value = prop.notes || ""; 
  
  propMode.dispatchEvent(new Event("change"));
  clearFormErrors();
  modalTitle.textContent = "Editar Propiedad";
  document.getElementById("modalSubmit").textContent = "Guardar Cambios";
  showModal(modalProperty);
}

[modalClose, modalCancel].forEach(btn => {
  btn.addEventListener("click", () => hideModal(modalProperty));
});

propertyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validatePropertyForm()) return;

  const submitBtn = document.getElementById("modalSubmit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Guardando…";

  const isIndividual = propMode.value === "individual";

  const data = {
    name: propName.value.trim(),
    type: propType.value,
    rentMode: propMode.value,
    location: propLocation.value.trim(),
    price: Number(propPrice.value),
    status: propStatus.value,
    units: isIndividual ? Number(propUnits.value) : 1,
    rooms: !isIndividual ? Number(propRooms.value) : null,
    baths: !isIndividual ? Number(propBaths.value) : null,
    notes: !isIndividual ? propNotes.value.trim() : "", 
  };

  try {
    const id = propIdInput.value;
    if (id) {
      await updateProperty(id, data);
      const idx = allProperties.findIndex(p => p.id === id);
      if (idx !== -1) allProperties[idx] = { id, ...data };
    } else {
      const newProp = await addProperty(data);
      if (isIndividual) {
        await generateEmptyUnits(newProp.id, data.units, data.price);
      }
      allProperties.push(newProp);
    }
    renderGrid(allProperties);
    lucide.createIcons();
    hideModal(modalProperty);
  } catch (err) {
    console.error("Error guardando propiedad:", err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = propIdInput.value ? "Guardar Cambios" : "Guardar Propiedad";
  }
});

function openDeleteModal(prop) {
  deleteTargetId = prop.id;
  deletePropName.textContent = prop.name;
  showModal(modalDelete);
}

[deleteClose, deleteCancel].forEach(btn => btn.addEventListener("click", () => hideModal(modalDelete)));

deleteConfirm.addEventListener("click", async () => {
  if (!deleteTargetId) return;
  deleteConfirm.disabled = true;
  deleteConfirm.textContent = "Eliminando…";
  try {
    await deleteProperty(deleteTargetId);
    allProperties = allProperties.filter(p => p.id !== deleteTargetId);
    renderGrid(allProperties);
    lucide.createIcons();
    hideModal(modalDelete);
  } catch (err) {
    console.error("Error eliminando propiedad:", err);
  } finally {
    deleteConfirm.disabled = false;
    deleteConfirm.textContent = "Sí, eliminar";
    deleteTargetId = null;
  }
});

function validatePropertyForm() {
  let valid = true;
  if (!propName.value.trim()) { setFieldError("propName", "propNameError", "El nombre es obligatorio."); valid = false; } else clearFieldError("propName", "propNameError");
  if (!propType.value) { setFieldError("propType", "propTypeError", "Selecciona un tipo."); valid = false; } else clearFieldError("propType", "propTypeError");
  if (!propMode.value) { setFieldError("propMode", "propModeError", "Selecciona una modalidad."); valid = false; } else clearFieldError("propMode", "propModeError");
  if (!propLocation.value.trim()) { setFieldError("propLocation", "propLocationError", "La ubicación es obligatoria."); valid = false; } else clearFieldError("propLocation", "propLocationError");
  if (propMode.value === "individual" && (!propUnits.value || Number(propUnits.value) < 1)) {
    setFieldError("propUnits", "propUnitsError", "Ingresa al menos 1 unidad."); valid = false;
  } else clearFieldError("propUnits", "propUnitsError");
  if (!propPrice.value || Number(propPrice.value) < 0) { setFieldError("propPrice", "propPriceError", "Ingresa un precio válido."); valid = false; } else clearFieldError("propPrice", "propPriceError");
  if (!propStatus.value) { setFieldError("propStatus", "propStatusError", "Selecciona un estado."); valid = false; } else clearFieldError("propStatus", "propStatusError");
  return valid;
}

function setFieldError(inputId, errorId, msg) {
  document.getElementById(inputId)?.closest(".form-group")?.classList.add("has-error");
  const err = document.getElementById(errorId);
  if (err) err.textContent = msg;
}
function clearFieldError(inputId, errorId) {
  document.getElementById(inputId)?.closest(".form-group")?.classList.remove("has-error");
  const err = document.getElementById(errorId);
  if (err) err.textContent = "";
}
function clearFormErrors() {
  propertyForm.querySelectorAll(".form-group").forEach(g => g.classList.remove("has-error"));
  propertyForm.querySelectorAll(".error-message").forEach(e => e.textContent = "");
}
function showModal(modal) { modal.hidden = false; document.body.style.overflow = "hidden"; setTimeout(() => modal.querySelector("input, select, button")?.focus(), 50); }
function hideModal(modal) { modal.hidden = true; document.body.style.overflow = ""; }
function getInitials(name) { return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(""); }
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!modalProperty.hidden) hideModal(modalProperty);
    if (!modalDelete.hidden) hideModal(modalDelete);
  }
});