// ============================================================
//  FLOAST — auth.js (conectado a Firebase)
// ============================================================

import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";


/** Observa cambios de sesión */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) { callback(null); return; }
    try {
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      const profile = snap.exists() ? snap.data() : {};
      callback({ ...firebaseUser, ...profile });
    } catch (e) {
      // Firestore no disponible — igual continúa con el usuario de Auth
      callback(firebaseUser);
    }
  });
}


/** Inicia sesión */
export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  try {
    const snap = await getDoc(doc(db, "users", credential.user.uid));
    const profile = snap.exists() ? snap.data() : {};
    return { user: { ...credential.user, ...profile } };
  } catch (e) {
    return { user: credential.user };
  }
}
export async function registerUser(email, password, extraData = {}) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // Guardar perfil en Firestore (no bloqueante — si falla igual continúa)
  try {
    const firstName      = extraData.firstName      ?? "";
    const fatherLastName = extraData.fatherLastName ?? "";
    const motherLastName = extraData.motherLastName ?? "";
    const fullName       = [firstName, fatherLastName, motherLastName].filter(Boolean).join(" ");

    await updateProfile(credential.user, { displayName: fullName });

    await setDoc(doc(db, "users", credential.user.uid), {
      email,
      firstName,
      fatherLastName,
      motherLastName,
      name:      fullName,
      phone:     extraData.phone ?? "",
      plan:      "spark",
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("Perfil no guardado en Firestore:", e.message);
  }

  return { user: credential.user };
}


/** Cierra sesión */
export async function logoutUser() {
  await signOut(auth);
}


/** Envía correo de recuperación */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}


/** Mensajes de error en español */
export function getAuthErrorMessage(code) {
  const messages = {
    "auth/invalid-credential":     "Correo o contraseña incorrectos.",
    "auth/user-not-found":         "No existe una cuenta con ese correo.",
    "auth/wrong-password":         "Contraseña incorrecta.",
    "auth/email-already-in-use":   "Ya existe una cuenta con ese correo.",
    "auth/weak-password":          "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-email":          "El formato del correo no es válido.",
    "auth/too-many-requests":      "Demasiados intentos. Espera unos minutos.",
    "auth/network-request-failed": "Sin conexión. Revisa tu internet.",
    "auth/user-disabled":          "Esta cuenta ha sido deshabilitada.",
  };
  return messages[code] ?? "Ocurrió un error inesperado. Intenta de nuevo.";
}