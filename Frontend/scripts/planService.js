// ============================================================
//  FLOAST — planService.js
//  Gestión del plan del usuario: Spark (free) y Sparkle (pro)
//
//  LÍMITES SPARK:
//  - 3 viviendas
//  - 3 edificios
//
//  PARA FIREBASE:
//  El plan se guarda en el documento del usuario en Firestore:
//  users/{uid} → { plan: "spark" | "sparkle" }
// ============================================================

export const PLANS = {
  spark: {
    name:       "Spark",
    label:      "Gratis",
    limits:     { vivienda: 3, edificio: 3 },
    color:      "var(--color-text-muted)",
    icon:       "zap",
  },
  sparkle: {
    name:       "Sparkle",
    label:      "Pro",
    limits:     { vivienda: Infinity, edificio: Infinity },
    color:      "var(--color-accent-bright)",
    icon:       "sparkles",
  },
};

// ── Obtener plan actual ────────────────────────────────────────
export function getUserPlan() {
  // ── MOCK ────────────────────────────────────────────────────
  const stored = sessionStorage.getItem("floast_user");
  const user   = stored ? JSON.parse(stored) : {};
  return user.plan || "spark";
  // ── FIRESTORE ───────────────────────────────────────────────
  // const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
  // return snap.data()?.plan || "spark";
}

// ── Cambiar plan ───────────────────────────────────────────────
export function setUserPlan(plan) {
  // ── MOCK ────────────────────────────────────────────────────
  const stored = sessionStorage.getItem("floast_user");
  const user   = stored ? JSON.parse(stored) : {};
  user.plan    = plan;
  sessionStorage.setItem("floast_user", JSON.stringify(user));
  // ── FIRESTORE ───────────────────────────────────────────────
  // await updateDoc(doc(db, "users", auth.currentUser.uid), { plan });
}

// ── Verificar si puede agregar una propiedad ──────────────────
// Devuelve { allowed: bool, reason: string | null }
export function canAddProperty(plan, properties, newType) {
  const limits = PLANS[plan]?.limits || PLANS.spark.limits;
  const count  = properties.filter(p => p.type === newType).length;
  const limit  = limits[newType];

  if (count >= limit) {
    return {
      allowed: false,
      type:    newType,
      current: count,
      limit,
    };
  }
  return { allowed: true };
}
