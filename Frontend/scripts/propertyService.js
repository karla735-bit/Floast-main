// ============================================================
//  FLOAST — propertyService.js
//  Capa de datos para propiedades.
//  Mismo patrón: mock hoy, Firestore mañana.
//
//  MODELO:
//  type:         "vivienda" | "edificio"
//  rentMode:     "completo" | "individual"
//  buildingType: "normal" | "hibrido"  (solo edificios)
//  price:        número global (solo rentMode === "completo")
//  description:  descripción general
//  status:       "disponible" | "rentada" | "mantenimiento"
// ============================================================

// ── Descomentar cuando Firestore esté listo ──────────────────
// import { auth } from "./firebase.js";
// import { getFirestore, collection, doc, getDocs,
//          addDoc, updateDoc, deleteDoc, getDoc,
//          query, where, serverTimestamp }
//   from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
// const db = getFirestore();
// ─────────────────────────────────────────────────────────────

// ── MOCK ─────────────────────────────────────────────────────
let MOCK_PROPERTIES = [
  // Vivienda rentada completa
  {
    id: "prop_1",
    name: "Casa las Torres",
    type: "vivienda",
    rentMode: "completo",
    buildingType: null,
    location: "Col. Centro",
    description:
      "Casa de un piso con 3 habitaciones, 2 baños, sala, comedor y cocina integral. Cuenta con patio trasero y estacionamiento para 1 auto.",
    habCount: 3,
    localCount: 0,
    price: 8500,
    status: "rentada",
    ownerId: "mock_user",
    createdAt: new Date("2024-01-15"),
  },
  // Vivienda rentada por habitaciones individuales
  {
    id: "prop_2",
    name: "Casa Madero",
    type: "vivienda",
    rentMode: "individual",
    buildingType: null,
    location: "Fco. I. Madero",
    description:
      "Casa amplia dividida en 4 habitaciones independientes con baño compartido, cocina y área de lavado de uso común.",
    habCount: 4,
    localCount: 0,
    price: null,
    status: "disponible",
    ownerId: "mock_user",
    createdAt: new Date("2024-03-08"),
  },
  // Edificio normal, renta individual por habitaciones
  {
    id: "prop_3",
    name: "Edificio Antonieta",
    type: "edificio",
    rentMode: "individual",
    buildingType: "normal",
    location: "Av. Juárez",
    description:
      "Edificio de 3 pisos con 12 habitaciones amuebladas, baño privado en cada una, área de lavandería común y acceso controlado.",
    habCount: 12,
    localCount: 0,
    price: null,
    status: "rentada",
    ownerId: "mock_user",
    createdAt: new Date("2024-06-21"),
  },
  // Edificio híbrido, renta individual (habitaciones + locales)
  {
    id: "prop_4",
    name: "Edificio Juárez Centro",
    type: "edificio",
    rentMode: "individual",
    buildingType: "hibrido",
    location: "Av. Juárez 45",
    description:
      "Edificio mixto de 4 pisos: planta baja con 4 locales comerciales, pisos 1-3 con 8 habitaciones. Ideal para emprendimientos y renta habitacional.",
    habCount: 8,
    localCount: 4,
    price: null,
    status: "disponible",
    ownerId: "mock_user",
    createdAt: new Date("2024-09-10"),
  },
  // Edificio rentado completo
  {
    id: "prop_5",
    name: "Edificio Norte",
    type: "edificio",
    rentMode: "completo",
    buildingType: "normal",
    location: "Col. Norte",
    description:
      "Edificio completo de 2 pisos con 6 habitaciones, ideal para empresas que requieren alojamiento para su personal.",
    habCount: 6,
    localCount: 0,
    price: 18000,
    status: "rentada",
    ownerId: "mock_user",
    createdAt: new Date("2024-11-01"),
  },
];

let mockIdCounter = 6;
// ─────────────────────────────────────────────────────────────

// Importamos la función para saber quién está logueado
import { getCurrentUser } from "./auth.js";

export async function getProperties() {
  const user = getCurrentUser();

  // DEBUG: Agrega esto para ver qué pasa en la consola del navegador
  console.log("Usuario actual detectado:", user);

  if (!user || !user.uid) {
    console.warn("No hay usuario o no tiene UID.");
    return [];
  }

  try {
    const url = `${API_URL}/user/${user.uid}`;
    console.log("Consultando URL:", url); // <--- DEBUG: Verifica que la URL esté bien

    const response = await fetch(url);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error del servidor:", errText);
      throw new Error("Error en servidor: " + errText);
    }

    const properties = await response.json();
    console.log("Propiedades recibidas:", properties); // <--- DEBUG
    return properties;
  } catch (error) {
    console.error("Error en getProperties:", error);
    return [];
  }
}

export async function getPropertyById(id) {
  try {
    // Consultamos la nueva ruta de Spring Boot que acabamos de crear
    const response = await fetch(`${API_URL}/${id}`);

    if (!response.ok) {
      console.warn("Propiedad no encontrada en el servidor");
      return null;
    }

    const property = await response.json();
    return property;
  } catch (error) {
    console.error("Error obteniendo propiedad por ID:", error);
    return null;
  }
}

// URL de tu backend en Spring Boot
const API_URL = "http://localhost:8080/api/properties";

export async function addProperty(propertyData) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(propertyData),
    });

    // Si el backend nos responde con un error (ej. el error 403 de Límite Alcanzado)
    if (!response.ok) {
      // Extraemos el mensaje de texto que mandamos desde Spring Boot
      const errorMessage = await response.text();
      throw new Error(errorMessage); // Lanzamos el error para atraparlo en el dashboard
    }

    const savedProperty = await response.json();
    return savedProperty;
  } catch (error) {
    console.error("Error en el servicio de propiedades:", error);
    throw error;
  }
}

export async function updateProperty(id, data, userId) {
  try {
    const payload = { ...data };
    if (userId) payload.userId = userId;

    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Error al actualizar la propiedad.");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en updateProperty:", error);
    throw error;
  }
}

export async function deleteProperty(id, userId) {
  try {
    const url = userId
      ? `${API_URL}/${id}?userId=${encodeURIComponent(userId)}`
      : `${API_URL}/${id}`;

    const response = await fetch(url, { method: "DELETE" });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Error al eliminar la propiedad.");
    }

    return true;
  } catch (error) {
    console.error("Error en deleteProperty:", error);
    throw error;
  }
}

// Este será el endpoint que el de backend debe crear: GET /api/properties/public
export async function getPublicProperties(filters = {}) {
  try {
    const url = new URL(`${API_URL}/public`);

    // Si mandas coordenadas, se añaden a la URL
    if (filters.lat && filters.lng) {
      url.searchParams.append("lat", filters.lat);
      url.searchParams.append("lng", filters.lng);
    }

    // Filtros opcionales
    if (filters.pets) url.searchParams.append("petsAllowed", "true");
    if (filters.children) url.searchParams.append("childrenAllowed", "true");
    if (filters.type) url.searchParams.append("type", filters.type);

    const response = await fetch(url);
    if (!response.ok) throw new Error("Error cargando propiedades públicas");

    return await response.json();
  } catch (error) {
    console.error("Error en getPublicProperties:", error);
    return [];
  }
}

function _delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
