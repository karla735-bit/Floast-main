// ============================================================
//  FLOAST — login.js
//  Lógica de UI del login. Solo habla con auth.js.
//  Nunca importa Firebase directamente.
// ============================================================

import { loginUser, onAuthChange, getAuthErrorMessage } from "./auth.js";

// ── Elementos del DOM ─────────────────────────────────────────
const form          = document.getElementById("loginForm");
const emailInput    = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const emailError    = document.getElementById("loginEmailError");
const passwordError = document.getElementById("loginPasswordError");
const submitBtn     = form.querySelector(".btn-submit");
const toggleBtn     = document.getElementById("toggleLoginPassword");

// ── Si ya hay sesión activa, redirige directo a la exploración ────
onAuthChange((user) => {
  if (user) {
    window.location.href = "explore.html"; // <-- Redirección al marketplace
  }
});

// ── Toggle visibilidad de contraseña ─────────────────────────
toggleBtn.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  toggleBtn.textContent = isPassword ? "🙈" : "👁️";
});

// ── Validación en tiempo real (limpia el error al escribir) ───
emailInput.addEventListener("input", () => clearError(emailError));
passwordInput.addEventListener("input", () => clearError(passwordError));

// ── Submit ────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  // Validación local antes de llamar al servidor
  let valid = true;

  if (!email) {
    showError(emailError, "El correo es obligatorio.");
    valid = false;
  } else if (!isValidEmail(email)) {
    showError(emailError, "Ingresa un correo válido.");
    valid = false;
  }

  if (!password) {
    showError(passwordError, "La contraseña es obligatoria.");
    valid = false;
  } else if (password.length < 6) {
    showError(passwordError, "Mínimo 6 caracteres.");
    valid = false;
  }

  if (!valid) return;

  // Estado de carga
  setLoading(true);

  try {
    const { user } = await loginUser(email, password);

    // Guardar sesión en sessionStorage
    sessionStorage.setItem("floast_user", JSON.stringify({
      email: user.email,
      name:  user.name ?? user.displayName ?? "",
    }));

    // --- LÓGICA DE REDIRECCIÓN INTELIGENTE ---
    const redirectTarget = sessionStorage.getItem("redirect_after_login");
    
    if (redirectTarget) {
      sessionStorage.removeItem("redirect_after_login");
      window.location.href = redirectTarget; 
    } else {
      window.location.href = "explore.html"; 
    }

  } catch (err) {
    const message = getAuthErrorMessage(err.code);
    if (err.code === "auth/invalid-email") {
      showError(emailError, message);
    } else {
      showError(passwordError, message);
    }
  } finally {
    setLoading(false);
  }
}); // <-- Aquí está el cierre correcto del evento submit

// ── Helpers ───────────────────────────────────────────────────
function showError(element, message) {
  element.textContent = message;
  element.closest(".form-group")?.classList.add("has-error");
}

function clearError(element) {
  element.textContent = "";
  element.closest(".form-group")?.classList.remove("has-error");
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Iniciando sesión…" : "Iniciar Sesión";
  submitBtn.style.opacity = loading ? "0.7" : "1";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}