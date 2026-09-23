// ============================================================
//  FLOAST — explore.js
// ============================================================

import { getPublicProperties } from "./propertyService.js";
import { getCurrentUser } from "./auth.js";

// --- Variables de Estado ---
let currentLocation = { lat: null, lng: null }; // Por defecto vacío
const CHILPANCINGO_COORDS = { lat: 17.55, lng: -99.5 };

// --- Elementos DOM ---
const exploreGrid = document.getElementById("exploreGrid");
const exploreLoading = document.getElementById("exploreLoading");
const exploreEmpty = document.getElementById("exploreEmpty");
const resultsCount = document.getElementById("resultsCount");
const locationStatus = document.getElementById("locationStatus");
const headerAuthActions = document.getElementById("headerAuthActions");

// Filtros
const btnApplyFilters = document.getElementById("btnApplyFilters");
const btnResetFilters = document.getElementById("btnResetFilters");
const btnEmptyClear = document.getElementById("btnEmptyClear");

// --- 1. Inicialización y Autenticación del Header ---
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  checkAuthHeader();
  requestLocationAndFetch();
});

function checkAuthHeader() {
  const user = getCurrentUser();
  const authButtons = document.getElementById("authButtons");
  const userMenu = document.getElementById("userMenu");

  if (user) {
    // Tiene sesión: ocultamos login/registro, mostramos "Mi Panel"
    if (authButtons) authButtons.hidden = true;
    if (userMenu) userMenu.hidden = false;
  }
}

// --- Añade este bloque al final de tu explore.js ---
const btnPublishProperty = document.getElementById("btnPublishProperty");
if (btnPublishProperty) {
  btnPublishProperty.addEventListener("click", () => {
    const user = getCurrentUser();

    if (!user) {
      // No tiene sesión: guardamos la intención de ir a publicar
      // Agregamos "?action=new" a la URL para saber qué quería hacer
      sessionStorage.setItem(
        "redirect_after_login",
        "dashboard.html?action=new",
      );
      window.location.href = "login.html";
    } else {
      // Ya tiene sesión: lo mandamos directo
      window.location.href = "dashboard.html?action=new";
    }
  });
}

// --- 2. Geolocalización ---
function requestLocationAndFetch() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentLocation.lat = position.coords.latitude;
        currentLocation.lng = position.coords.longitude;
        locationStatus.innerHTML = `<i data-lucide="check-circle"></i> Cerca de ti`;
        locationStatus.style.color = "var(--color-success)";
        lucide.createIcons();
        fetchProperties();
      },
      (error) => {
        console.warn("Ubicación denegada. Usando fallback (Chilpancingo).");
        currentLocation = CHILPANCINGO_COORDS;
        locationStatus.innerHTML = `<i data-lucide="map"></i> Chilpancingo, Gro.`;
        locationStatus.style.color = "var(--color-text-muted)";
        lucide.createIcons();
        fetchProperties();
      },
    );
  } else {
    fetchProperties(); // Navegador no soporta GPS
  }
}

// --- 3. Obtener Propiedades (Filtros) ---
async function fetchProperties() {
  exploreLoading.hidden = false;
  exploreGrid.hidden = true;
  exploreEmpty.hidden = true;

  // Recolectar filtros del panel
  const filters = {
    lat: currentLocation.lat,
    lng: currentLocation.lng,
    type: document.getElementById("filterType").value,
    petsAllowed: document.getElementById("filterPets").checked,
    childrenAllowed: document.getElementById("filterChildren").checked,
    amenities: [],
  };

  if (document.getElementById("filterWifi").checked)
    filters.amenities.push("internet");
  if (document.getElementById("filterWater").checked)
    filters.amenities.push("agua");

  try {
    const properties = await getPublicProperties(filters);
    renderExploreGrid(properties);
  } catch (err) {
    console.error("Error al cargar marketplace:", err);
    renderExploreGrid([]);
  }
}

// --- 4. Renderizar Tarjetas ---
function renderExploreGrid(properties) {
  exploreLoading.hidden = true;

  if (properties.length === 0) {
    exploreGrid.hidden = true;
    exploreEmpty.hidden = false;
    resultsCount.textContent = "0 resultados";
    return;
  }

  exploreEmpty.hidden = true;
  exploreGrid.hidden = false;
  exploreGrid.innerHTML = "";
  resultsCount.textContent = `${properties.length} resultado${properties.length > 1 ? "s" : ""}`;

  properties.forEach((prop, i) => {
    const card = document.createElement("div");
    card.className = "property-card";
    card.style.animationDelay = `${i * 60}ms`;

    // Pequeños íconos de políticas para la tarjeta
    let badgesHtml = "";
    if (prop.policies?.petsAllowed)
      badgesHtml += `<i data-lucide="dog" title="Acepta mascotas"></i>`;
    if (prop.policies?.childrenAllowed)
      badgesHtml += `<i data-lucide="baby" title="Acepta niños"></i>`;
    if (prop.amenities?.includes("internet"))
      badgesHtml += `<i data-lucide="wifi" title="Internet disponible"></i>`;

    // Ajustamos la tarjeta pública (Sin botón de eliminar/editar, pero con "Me interesa")
    const priceStr = prop.price
      ? `$${Number(prop.price).toLocaleString("es-MX")}`
      : "Consultar";

    card.innerHTML = `
            <div class="card-illustration" data-type="${prop.type?.toLowerCase() || "vivienda"}">
                <i data-lucide="${prop.type?.toLowerCase() === "edificio" ? "building-2" : "house"}" class="prop-icon"></i>
            </div>
            <div class="card-body">
                <p class="card-type">${prop.type || "Inmueble"} · ${prop.rentMode || "Completo"}</p>
                <p class="card-name">${prop.name}</p>
                <div class="card-meta">
                    <span class="card-meta-item"><i data-lucide="map-pin"></i>${prop.location}</span>
                </div>
                <div class="card-meta" style="gap:0.4rem; color:var(--color-accent-bright);">
                    ${badgesHtml}
                </div>
                <div class="card-footer" style="margin-top:0.8rem; display:flex; justify-content:space-between; align-items:center;">
                    <p class="card-price">${priceStr}</p>
                    <button class="btn-submit btn-contact" data-id="${prop.id}" style="height:32px; padding:0 1rem; font-size:0.7rem;">Me Interesa</button>
                </div>
            </div>
        `;
    exploreGrid.appendChild(card);
  });

  lucide.createIcons();
  bindContactButtons();
}

// --- 5. Muro de Registro (Interceptar el click) ---
function bindContactButtons() {
  document.querySelectorAll(".btn-contact").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const propId = e.target.getAttribute("data-id");
      const user = getCurrentUser();

      if (!user) {
        // GUARDAR INTENCIÓN: Si se loguea, lo regresamos aquí (o a la vista detallada)
        sessionStorage.setItem(
          "redirect_after_login",
          `property.html?id=${propId}`,
        );

        // Redirigir al login
        window.location.href = "login.html";
      } else {
        // Si ya tiene sesión, lo dejamos pasar a ver la propiedad completa
        window.location.href = `property.html?id=${propId}`;
      }
    });
  });
}

// --- 6. Eventos de los Botones de Filtro ---
btnApplyFilters.addEventListener("click", fetchProperties);

const clearFilters = () => {
  document.getElementById("filterType").value = "";
  document.getElementById("filterPets").checked = false;
  document.getElementById("filterChildren").checked = false;
  document.getElementById("filterWifi").checked = false;
  document.getElementById("filterWater").checked = false;
  fetchProperties();
};

btnResetFilters.addEventListener("click", clearFilters);
btnEmptyClear.addEventListener("click", clearFilters);
