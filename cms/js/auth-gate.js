import { loadCmsConfig } from "./github-client.js";

const SESSION_KEY = "portfolio_cms_gate";

async function sha256(text) {
  if (!crypto?.subtle) {
    throw new Error("Password check needs a secure connection (HTTPS).");
  }
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getAccessConfig(config) {
  const access = config?.cmsAccess;
  if (!access?.username || !access?.passwordSha256) return null;
  if (String(access.passwordSha256).includes("YOUR_")) return null;
  return access;
}

function hasValidSession(access) {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return false;
  try {
    const { user, exp } = JSON.parse(raw);
    if (user !== access.username) return false;
    if (Date.now() > exp) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function setSession(access) {
  const hours = Number(access.sessionHours) || 12;
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      user: access.username,
      exp: Date.now() + hours * 60 * 60 * 1000,
    })
  );
}

export function clearCmsSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function showApp() {
  document.getElementById("bo-login-gate")?.setAttribute("hidden", "hidden");
  document.getElementById("bo-app")?.removeAttribute("hidden");
}

function showGate() {
  document.getElementById("bo-app")?.setAttribute("hidden", "hidden");
  document.getElementById("bo-login-gate")?.removeAttribute("hidden");
}

function wireLoginScreen(access, onSuccess) {
  const root = document.getElementById("bo-login-gate");
  const form = document.getElementById("bo-gate-form");
  if (!root || !form) {
    throw new Error("CMS login screen missing. Hard-refresh /cms/ (Ctrl+F5).");
  }

  const errEl = document.getElementById("bo-gate-error");
  const userInput = document.getElementById("bo-gate-user");
  if (userInput && !userInput.value) userInput.value = access.username;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errEl) errEl.hidden = true;
    const username = form.username.value.trim();
    const password = form.password.value;
    const expectedUser = String(access.username).trim();
    if (username.toLowerCase() !== expectedUser.toLowerCase()) {
      if (errEl) {
        errEl.textContent = "Invalid username or password.";
        errEl.hidden = false;
      }
      return;
    }
    try {
      const hash = await sha256(password);
      const expectedHash = String(access.passwordSha256).trim().toLowerCase();
      if (hash !== expectedHash) {
        if (errEl) {
          errEl.textContent = "Invalid username or password.";
          errEl.hidden = false;
        }
        return;
      }
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message || "Could not verify password.";
        errEl.hidden = false;
      }
      return;
    }
    setSession(access);
    showApp();
    onSuccess();
  });
}

/** Blocks until CMS username/password gate passes (if configured). */
export async function ensureCmsAccess() {
  const config = await loadCmsConfig();
  const access = getAccessConfig(config);
  if (!access) {
    showApp();
    return;
  }

  if (hasValidSession(access)) {
    showApp();
    return;
  }

  showGate();

  await new Promise((resolve) => {
    wireLoginScreen(access, resolve);
  });
}
