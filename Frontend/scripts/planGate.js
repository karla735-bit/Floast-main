// ============================================================
//  FLOAST — planGate.js
//  Modal de límite de plan y gestión del banner Spark/Sparkle
// ============================================================

import { PLANS, getUserPlan, setUserPlan } from "./planService.js";

// ── Banner en el header ───────────────────────────────────────
export function renderPlanBadge() {
  const plan     = getUserPlan();
  const planInfo = PLANS[plan];

  // Si ya existe, actualizarlo
  let badge = document.getElementById("planBadge");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "planBadge";
    // Insertar dentro de .header-user, justo después del bloque de nombre/rol
    const userInfo = document.querySelector(".header-user-info");
    if (userInfo) userInfo.insertAdjacentElement("afterend", badge);
  }

  badge.className   = `plan-badge plan-badge--${plan}`;
  badge.innerHTML   = `
    <i data-lucide="${planInfo.icon}" class="plan-badge-icon"></i>
    <span>${planInfo.name}</span>
  `;

  lucide.createIcons();
}

// ── Modal de límite alcanzado ─────────────────────────────────
export function showLimitModal(type, onContinueFree, onUpgrade) {
  // Eliminar si ya existe
  const existing = document.getElementById("limitModal");
  if (existing) existing.remove();

  const typeLabel = type === "vivienda" ? "viviendas" : "edificios";
  const limit     = PLANS.spark.limits[type];

  const overlay = document.createElement("div");
  overlay.id        = "limitModal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal limit-modal" role="dialog" aria-modal="true">

      <!-- Icono decorativo -->
      <div class="limit-icon-wrap">
        <div class="limit-icon-ring">
          <i data-lucide="zap" class="limit-icon"></i>
        </div>
      </div>

      <!-- Texto -->
      <div class="limit-content">
        <h3 class="limit-title">Límite del plan Spark alcanzado</h3>
        <p class="limit-desc">
          Has registrado el máximo de
          <strong>${limit} ${typeLabel}</strong>
          que permite el plan gratuito.
          Actualiza a <strong>Sparkle</strong> para agregar inmuebles sin límite
          y desbloquear todas las funciones.
        </p>
      </div>

      <!-- Comparativa de planes -->
      <div class="plan-compare">
        <div class="plan-compare-col plan-compare-col--spark">
          <div class="plan-compare-header">
            <i data-lucide="zap"></i>
            <span>Spark</span>
            <span class="plan-compare-label">Actual</span>
          </div>
          <ul class="plan-compare-list">
            <li><i data-lucide="check"></i>Hasta 3 viviendas</li>
            <li><i data-lucide="check"></i>Hasta 3 edificios</li>
            <li><i data-lucide="x" class="icon-no"></i>Propiedades ilimitadas</li>
            <li><i data-lucide="x" class="icon-no"></i>Reportes avanzados</li>
          </ul>
        </div>
        <div class="plan-compare-col plan-compare-col--sparkle">
          <div class="plan-compare-header">
            <i data-lucide="sparkles"></i>
            <span>Sparkle</span>
            <span class="plan-compare-label plan-compare-label--pro">Pro</span>
          </div>
          <ul class="plan-compare-list">
            <li><i data-lucide="check"></i>Hasta 3 viviendas</li>
            <li><i data-lucide="check"></i>Hasta 3 edificios</li>
            <li><i data-lucide="check"></i>Propiedades ilimitadas</li>
            <li><i data-lucide="check"></i>Reportes avanzados</li>
          </ul>
        </div>
      </div>

      <!-- Acciones -->
      <div class="limit-actions">
        <button class="btn-secondary limit-btn-free" id="limitKeepFree">
          Continuar con Spark
        </button>
        <button class="btn-upgrade" id="limitUpgrade">
          <i data-lucide="sparkles"></i>
          Cambiar a Sparkle
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  lucide.createIcons();

  // Cerrar al hacer clic fuera
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeLimitModal(onContinueFree);
  });

  document.getElementById("limitKeepFree").addEventListener("click", () => {
    closeLimitModal(onContinueFree);
  });

  document.getElementById("limitUpgrade").addEventListener("click", () => {
    upgradePlan(onUpgrade);
  });
}

// ── Cerrar modal ──────────────────────────────────────────────
function closeLimitModal(callback) {
  const modal = document.getElementById("limitModal");
  if (modal) modal.remove();
  document.body.style.overflow = "";
  if (callback) callback();
}

// ── Subir a Sparkle ───────────────────────────────────────────
function upgradePlan(callback) {
  setUserPlan("sparkle");

  // Animar el badge antes de cerrar
  const badge = document.getElementById("planBadge");
  if (badge) {
    badge.classList.add("plan-badge--upgrading");
    setTimeout(() => {
      renderPlanBadge();
      badge.classList.remove("plan-badge--upgrading");
    }, 400);
  } else {
    renderPlanBadge();
  }

  closeLimitModal(callback);

  // Toast de confirmación
  showToast("¡Bienvenido a Sparkle! 🎉 Ahora puedes agregar propiedades sin límite.");
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(message) {
  const existing = document.getElementById("floastToast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id        = "floastToast";
  toast.className = "floast-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  // Aparecer
  requestAnimationFrame(() => toast.classList.add("floast-toast--visible"));

  // Desaparecer a los 3.5s
  setTimeout(() => {
    toast.classList.remove("floast-toast--visible");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}
