// ============================================================
//  FLOAST — avatarCatalog.js
//  Catálogo de avatares disponibles.
//
//  CÓMO AGREGAR IMÁGENES:
//  1. Coloca tus archivos PNG/JPG en:
//     Frontend/assets/resources/
//  2. Agrega el nombre del archivo a la lista AVATAR_CATALOG
//  3. La ruta se construye automáticamente
//
//  Las imágenes se referencian como:
//     ../assets/resources/nombre-del-archivo.png
// ============================================================

export const AVATAR_CATALOG = [
  // ── Agrega aquí los nombres de tus archivos ───────────────
  // Ejemplo: "avatar1.png", "avatar2.jpg", etc.
  // Por ahora hay placeholders SVG generados, reemplázalos
  // con tus propios archivos cuando los tengas.
  "avatar_01.png",
  "avatar_02.png",
  "avatar_03.png",
  "avatar_04.png",
  "avatar_05.png",
  "avatar_06.png",
  "avatar_07.png",
  "avatar_08.png",
  "avatar_09.png",
  "avatar_10.png",
  "avatar_11.png",
  "avatar_12.png",
];

// Ruta base donde viven las imágenes
export const AVATAR_BASE_PATH = "../assets/resources/";

// Construye la URL completa de un avatar
export function getAvatarUrl(filename) {
  if (!filename) return null;
  // Si ya es una URL completa (http/https o data:), devolverla tal cual
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  return AVATAR_BASE_PATH + filename;
}
