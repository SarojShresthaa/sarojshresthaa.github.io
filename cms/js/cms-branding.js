/** Applies CMS rail + login branding from site-settings.cmsBranding */

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function setLogoElement(el, text, imagePath) {
  if (!el) return;
  const img = String(imagePath || "").trim();
  el.classList.toggle("has-image", Boolean(img));
  if (img) {
    el.innerHTML = `<img src="${escapeAttr(img)}" alt="" loading="lazy" />`;
  } else {
    const t = String(text || "P").trim() || "P";
    el.textContent = t.length > 2 ? t.slice(0, 2) : t;
  }
}

export function applyCmsBranding(settings) {
  const b = settings?.cmsBranding || {};
  const logoText = b.logoText ?? "P";
  const logoImage = b.logoImage ?? "";
  const same = b.useSameLogoForLogin !== false;
  const loginText = same ? logoText : b.loginLogoText ?? logoText;
  const loginImage = same ? logoImage : b.loginLogoImage ?? "";

  setLogoElement(document.getElementById("bo-rail-logo"), logoText, logoImage);
  setLogoElement(document.getElementById("bo-gate-mark"), loginText, loginImage);

  const titleEl = document.getElementById("bo-gate-title");
  const subEl = document.getElementById("bo-gate-sub");
  if (titleEl) titleEl.textContent = b.loginTitle?.trim() || "Portfolio CMS";
  if (subEl) {
    subEl.textContent =
      b.loginSubtitle?.trim() ||
      "Sign in to open the backoffice. GitHub sign-in is used separately when you save.";
  }
}

export async function fetchAndApplyCmsBranding() {
  try {
    const res = await fetch("/content/site-settings.json", { cache: "no-cache" });
    if (!res.ok) return;
    applyCmsBranding(await res.json());
  } catch {
    applyCmsBranding({});
  }
}
