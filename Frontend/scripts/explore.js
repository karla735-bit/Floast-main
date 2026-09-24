// ============================================================
//  FLOAST — explore.js
// ============================================================

import { getPublicProperties } from "./propertyService.js";
import { getCurrentUser, onAuthChange } from "./auth.js";

// --- Variables de Estado ---
let currentLocation = { lat: null, lng: null };
const CHILPANCINGO_COORDS = { lat: 17.5500, lng: -99.5000 };

// Variables de paginación
let currentPage = 1;
const pageSize = 12; 
let totalPages = 1;

// --- Elementos DOM ---
const exploreGrid = document.getElementById("exploreGrid");
const exploreLoading = document.getElementById("exploreLoading");
const exploreEmpty = document.getElementById("exploreEmpty");
const resultsCount = document.getElementById("resultsCount");
const locationStatus = document.getElementById("locationStatus");

// Filtros
const btnApplyFilters = document.getElementById("btnApplyFilters");
const btnResetFilters = document.getElementById("btnResetFilters");
const btnEmptyClear = document.getElementById("btnEmptyClear");

// Botón de publicar
const btnPublishProperty = document.getElementById("btnPublishProperty");

// --- 1. Observador de Sesión Reactivo ---
// Esto espera pacientemente a que Firebase responda y cambia la UI acorde.
onAuthChange((user) => {
    const authButtons = document.getElementById("authButtons");
    const userMenu = document.getElementById("userMenu");

    if (user) {
        if (authButtons) authButtons.hidden = true;
        if (userMenu) userMenu.hidden = false;
    } else {
        if (authButtons) authButtons.hidden = false;
        if (userMenu) userMenu.hidden = true;
    }
});

// --- 2. Inicialización ---
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    requestLocationAndFetch();
});

// --- 3. Geolocalización ---
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
            }
        );
    } else {
        fetchProperties(); 
    }
}

// --- 4. Obtener Propiedades (Filtros + Paginación) ---
async function fetchProperties() {
    exploreLoading.hidden = false;
    exploreGrid.hidden = true;
    exploreEmpty.hidden = true;
    document.getElementById("paginationControls").hidden = true;

    const filters = {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        type: document.getElementById("filterType").value,
        petsAllowed: document.getElementById("filterPets").checked,
        childrenAllowed: document.getElementById("filterChildren").checked,
        amenities: []
    };

    if (document.getElementById("filterWifi").checked) filters.amenities.push("internet");
    if (document.getElementById("filterWater").checked) filters.amenities.push("agua");

    try {
        const responseData = await getPublicProperties(filters, currentPage, pageSize);
        
        if (!responseData) {
            renderExploreGrid([]);
            return;
        }

        const properties = responseData.content || responseData;
        totalPages = responseData.totalPages || 1;

        renderExploreGrid(properties);
        updatePaginationUI();
    } catch (err) {
        console.error("Error al cargar marketplace:", err);
        renderExploreGrid([]);
    }
}

// --- 5. Renderizar Tarjetas ---
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
    resultsCount.textContent = `${properties.length} resultado${properties.length > 1 ? 's' : ''}`;

    properties.forEach((prop, i) => {
        const card = document.createElement("div");
        card.className = "property-card";
        card.style.animationDelay = `${i * 60}ms`;

        let badgesHtml = "";
        if (prop.policies?.petsAllowed) badgesHtml += `<i data-lucide="dog" title="Acepta mascotas"></i>`;
        if (prop.policies?.childrenAllowed) badgesHtml += `<i data-lucide="baby" title="Acepta niños"></i>`;
        if (prop.amenities?.includes("internet")) badgesHtml += `<i data-lucide="wifi" title="Internet disponible"></i>`;

        const priceStr = prop.price ? `$${Number(prop.price).toLocaleString("es-MX")}` : "Consultar";

        card.innerHTML = `
            <div class="card-illustration" data-type="${prop.type?.toLowerCase() || 'vivienda'}">
                <i data-lucide="${prop.type?.toLowerCase() === 'edificio' ? 'building-2' : 'house'}" class="prop-icon"></i>
            </div>
            <div class="card-body">
                <p class="card-type">${prop.type || 'Inmueble'} · ${prop.rentMode || 'Completo'}</p>
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

// --- 6. Interceptar acciones que requieren sesión ---
function bindContactButtons() {
    document.querySelectorAll(".btn-contact").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const propId = e.target.getAttribute("data-id");
            const user = getCurrentUser();

            if (!user) {
                sessionStorage.setItem("redirect_after_login", `property.html?id=${propId}`);
                window.location.href = "login.html";
            } else {
                window.location.href = `property.html?id=${propId}`;
            }
        });
    });
}

if (btnPublishProperty) {
    btnPublishProperty.addEventListener("click", () => {
        const user = getCurrentUser();
        
        if (!user) {
            sessionStorage.setItem("redirect_after_login", "dashboard.html?action=new");
            window.location.href = "login.html";
        } else {
            window.location.href = "dashboard.html?action=new";
        }
    });
}

// --- 7. Eventos de Paginación y Filtros ---
function updatePaginationUI() {
    const paginationControls = document.getElementById("paginationControls");
    const btnPrev = document.getElementById("btnPrevPage");
    const btnNext = document.getElementById("btnNextPage");
    const indicator = document.getElementById("pageIndicator");

    if (totalPages <= 1) {
        paginationControls.hidden = true;
        return;
    }

    paginationControls.hidden = false;
    indicator.textContent = `Página ${currentPage} de ${totalPages}`;
    
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= totalPages;
}

document.getElementById("btnPrevPage")?.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        fetchProperties();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

document.getElementById("btnNextPage")?.addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        fetchProperties();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

btnApplyFilters.addEventListener("click", () => {
    currentPage = 1;
    fetchProperties();
});

const clearFilters = () => {
    document.getElementById("filterType").value = "";
    document.getElementById("filterPets").checked = false;
    document.getElementById("filterChildren").checked = false;
    document.getElementById("filterWifi").checked = false;
    document.getElementById("filterWater").checked = false;
    currentPage = 1;
    fetchProperties();
};

btnResetFilters.addEventListener("click", clearFilters);
btnEmptyClear.addEventListener("click", clearFilters);