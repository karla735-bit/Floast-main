// ============================================================
//  FLOAST — profile.js
//  Lógica del modal de perfil de usuario.
//  Se importa desde dashboard.js
// ============================================================

import { AVATAR_CATALOG, AVATAR_BASE_PATH, getAvatarUrl } from "./avatarCatalog.js";
import { onAuthChange } from "./auth.js";
import { auth, db } from "./firebase.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// ── Estado ────────────────────────────────────────────────────
let currentUser      = null;
let selectedAvatar   = null; // filename seleccionado en el catálogo
let onProfileUpdated = null; // callback para notificar al dashboard

// ── Init: escucha auth para tener el usuario actualizado ──────
onAuthChange(async (user) => {
  if (!user) return;
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const profile = snap.exists() ? snap.data() : {};
    currentUser = { ...user, ...profile };
  } catch {
    currentUser = user;
  }
});

// ── Abrir modal ───────────────────────────────────────────────
export function openProfileModal(user, onUpdate) {
  currentUser      = user;
  onProfileUpdated = onUpdate;
  selectedAvatar   = user?.avatar || null;

  buildModal();
  populateModal();
  document.getElementById("profileModal").hidden = false;
  document.body.style.overflow = "hidden";
}

// ── Construir modal (solo la primera vez) ─────────────────────
function buildModal() {
  if (document.getElementById("profileModal")) return;

  const overlay = document.createElement("div");
  overlay.id        = "profileModal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle">

      <div class="modal-header">
        <h3 class="modal-title" id="profileModalTitle">Mi Perfil</h3>
        <button class="modal-close" id="profileClose" aria-label="Cerrar">
          <i data-lucide="x"></i>
        </button>
      </div>

      <!-- Vista previa del avatar actual -->
      <div class="profile-preview">
        <div class="profile-avatar-wrap">
          <div class="profile-avatar" id="profileAvatarPreview">
            <span class="profile-avatar-initials" id="profileAvatarInitials"></span>
            <img id="profileAvatarImg" src="" alt="Avatar" hidden>
          </div>
          <div class="profile-avatar-badge">
            <i data-lucide="camera"></i>
          </div>
        </div>
        <div class="profile-preview-info">
          <p class="profile-preview-name" id="profilePreviewName"></p>
          <p class="profile-preview-sub">Toca una imagen del catálogo para seleccionarla</p>
        </div>
      </div>

      <!-- Nombre -->
      <div class="form-group">
        <label for="profileName">Nombre de usuario</label>
        <input
          type="text"
          id="profileName"
          placeholder="Tu nombre completo"
          autocomplete="name"
          maxlength="60"
        >
        <span class="error-message" id="profileNameError"></span>
      </div>

      <!-- Catálogo de avatares -->
      <div class="catalog-section">
        <p class="catalog-title">
          <i data-lucide="image"></i>
          Elige tu avatar
        </p>
        <div class="catalog-grid" id="avatarCatalogGrid">
          <!-- Se llena con JS -->
        </div>
      </div>

      <!-- Acciones -->
      <div class="modal-actions">
        <button type="button" class="btn-secondary" id="profileCancel">Cancelar</button>
        <button type="button" class="btn-submit" id="profileSave">
          <i data-lucide="check"></i>
          Guardar Cambios
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  // Eventos
  overlay.addEventListener("click", e => { if (e.target === overlay) closeProfileModal(); });
  document.getElementById("profileClose").addEventListener("click",  closeProfileModal);
  document.getElementById("profileCancel").addEventListener("click", closeProfileModal);
  document.getElementById("profileSave").addEventListener("click",   saveProfile);
  document.getElementById("profileName").addEventListener("input",   onNameInput);

  lucide.createIcons();
}

// ── Poblar con datos del usuario actual ───────────────────────
function populateModal() {
  const nameInput    = document.getElementById("profileName");
  const previewName  = document.getElementById("profilePreviewName");
  const initials     = document.getElementById("profileAvatarInitials");
  const img          = document.getElementById("profileAvatarImg");
  const nameError    = document.getElementById("profileNameError");

  const name = currentUser?.name || currentUser?.displayName || "";
  nameInput.value       = name;
  previewName.textContent = name || "Tu nombre";
  initials.textContent  = getInitials(name);
  nameError.textContent = "";

  // Mostrar avatar actual si tiene uno
  updateAvatarPreview(currentUser?.avatar || null);

  // Llenar catálogo
  buildCatalog();

  // Reactivar selección previa si existe
  selectedAvatar = currentUser?.avatar || null;
  highlightSelected();
}

// ── Catálogo de imágenes ──────────────────────────────────────
function buildCatalog() {
  const grid = document.getElementById("avatarCatalogGrid");
  grid.innerHTML = "";

  // Opción: sin avatar (iniciales)
  const noneItem = document.createElement("button");
  noneItem.type      = "button";
  noneItem.className = "catalog-item catalog-item-none";
  noneItem.dataset.value = "";
  noneItem.title     = "Sin avatar (usar iniciales)";
  noneItem.innerHTML = `
    <div class="catalog-initials-preview" id="catalogInitialsPreview">
      ${getInitials(currentUser?.name || "?")}
    </div>
    <span class="catalog-item-label">Iniciales</span>
  `;
  noneItem.addEventListener("click", () => selectAvatar(""));
  grid.appendChild(noneItem);

  // Imágenes del catálogo
  AVATAR_CATALOG.forEach(filename => {
    const item = document.createElement("button");
    item.type        = "button";
    item.className   = "catalog-item";
    item.dataset.value = filename;
    item.title       = filename;

    const img = document.createElement("img");
    img.src   = AVATAR_BASE_PATH + filename;
    img.alt   = filename;
    img.className = "catalog-img";

    // Si la imagen no carga, mostrar placeholder
    img.onerror = () => {
      item.innerHTML = `
        <div class="catalog-broken">
          <i data-lucide="image-off"></i>
        </div>
        <span class="catalog-item-label">${filename}</span>
      `;
      lucide.createIcons();
    };

    const label = document.createElement("span");
    label.className   = "catalog-item-label";
    label.textContent = filename.replace(/\.[^.]+$/, ""); // sin extensión

    item.appendChild(img);
    item.appendChild(label);
    item.addEventListener("click", () => selectAvatar(filename));
    grid.appendChild(item);
  });
}

// ── Seleccionar avatar ────────────────────────────────────────
function selectAvatar(filename) {
  selectedAvatar = filename;
  highlightSelected();
  updateAvatarPreview(filename);
}

function highlightSelected() {
  document.querySelectorAll(".catalog-item").forEach(item => {
    item.classList.toggle("catalog-item-selected", item.dataset.value === (selectedAvatar ?? ""));
  });
}

function updateAvatarPreview(filename) {
  const img      = document.getElementById("profileAvatarImg");
  const initials = document.getElementById("profileAvatarInitials");

  if (filename) {
    img.src     = AVATAR_BASE_PATH + filename;
    img.hidden  = false;
    initials.hidden = true;
    img.onerror = () => { img.hidden = true; initials.hidden = false; };
  } else {
    img.hidden      = false === false; // siempre ocultar
    img.hidden      = true;
    initials.hidden = false;
  }
}

// ── Input de nombre en tiempo real ────────────────────────────
function onNameInput() {
  const val = document.getElementById("profileName").value;
  document.getElementById("profilePreviewName").textContent = val || "Tu nombre";
  document.getElementById("profileAvatarInitials").textContent = getInitials(val);
  document.getElementById("profileNameError").textContent = "";

  // Actualizar iniciales en la opción "sin avatar" del catálogo
  const preview = document.getElementById("catalogInitialsPreview");
  if (preview) preview.textContent = getInitials(val) || "?";
}

// ── Guardar ───────────────────────────────────────────────────
async function saveProfile() {
  const nameInput = document.getElementById("profileName");
  const saveBtn   = document.getElementById("profileSave");
  const nameError = document.getElementById("profileNameError");

  const name = nameInput.value.trim();

  if (!name) {
    nameError.textContent = "El nombre no puede estar vacío.";
    nameInput.focus();
    return;
  }

  saveBtn.disabled = true;
  saveBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Guardando…`;
  lucide.createIcons();

  try {
    const firebaseUser = auth.currentUser;

    // Actualizar displayName en Firebase Auth
    await updateProfile(firebaseUser, { displayName: name });

    // Guardar en Firestore (merge:true crea el doc si no existe)
    await setDoc(doc(db, "users", firebaseUser.uid), {
      name,
      avatar:    selectedAvatar || null,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    const updatedUser = {
      ...currentUser,
      name,
      displayName: name,
      avatar: selectedAvatar || null,
    };

    sessionStorage.setItem("floast_user", JSON.stringify(updatedUser));
    currentUser = updatedUser;

    if (onProfileUpdated) onProfileUpdated(updatedUser);
    closeProfileModal();

  } catch (err) {
    console.error("Error guardando perfil:", err);
    nameError.textContent = "Ocurrió un error. Intenta de nuevo.";
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<i data-lucide="check"></i> Guardar Cambios`;
    lucide.createIcons();
  }
}

// ── Cerrar ────────────────────────────────────────────────────
function closeProfileModal() {
  const modal = document.getElementById("profileModal");
  if (modal) modal.hidden = true;
  document.body.style.overflow = "";
}

// ── Helpers ───────────────────────────────────────────────────
function getInitials(name) {
  return (name || "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function _delay(ms) { return new Promise(r => setTimeout(r, ms)); }