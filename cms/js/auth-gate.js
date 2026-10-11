import { loadCmsConfig } from "./github-client.js";

const SESSION_KEY = "portfolio_cms_gate";

async function sha256(text) {
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

function renderLoginScreen(access, onSuccess) {
  const root = document.createElement("div");
  root.className = "bo-gate";
  root.innerHTML = `
    <form class="bo-gate-card" id="bo-gate-form">
      <h1>Portfolio CMS</h1>
      <p class="bo-gate-sub">Sign in to open the backoffice. This is separate from GitHub (used when you save).</p>
      <div class="bo-field">
        <label for="bo-gate-user">Username</label>
        <input id="bo-gate-user" name="username" autocomplete="username" required />
      </div>
      <div class="bo-field">
        <label for="bo-gate-pass">Password</label>
        <input id="bo-gate-pass" name="password" type="password" autocomplete="current-password" required />
      </div>
      <p class="bo-gate-error" id="bo-gate-error" hidden></p>
      <button type="submit" class="bo-btn primary bo-gate-submit">Sign in</button>
    </form>`;
  document.body.appendChild(root);

  const form = root.querySelector("#bo-gate-form");
  const errEl = root.querySelector("#bo-gate-error");
  const userInput = root.querySelector("#bo-gate-user");
  userInput.value = access.username;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    const username = form.username.value.trim();
    const password = form.password.value;
    if (username !== access.username) {
      errEl.textContent = "Invalid username or password.";
      errEl.hidden = false;
      return;
    }
    const hash = await sha256(password);
    if (hash !== access.passwordSha256.toLowerCase()) {
      errEl.textContent = "Invalid username or password.";
      errEl.hidden = false;
      return;
    }
    setSession(access);
    root.remove();
    onSuccess();
  });
}

/** Blocks until CMS username/password gate passes (if configured). */
export async function ensureCmsAccess() {
  const config = await loadCmsConfig();
  const access = getAccessConfig(config);
  if (!access) return;

  if (hasValidSession(access)) return;

  document.getElementById("bo-app")?.setAttribute("hidden", "hidden");

  await new Promise((resolve) => {
    renderLoginScreen(access, () => {
      document.getElementById("bo-app")?.removeAttribute("hidden");
      resolve();
    });
  });
}
