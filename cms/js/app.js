import { GitHubClient, loadCmsConfig, isOAuthConfigured } from "./github-client.js";
import { ensureCmsAccess, clearCmsSession } from "./auth-gate.js";
import { applyCmsBranding, fetchAndApplyCmsBranding } from "./cms-branding.js";
import { imageFieldHtml, wireImagePickers } from "./media-picker.js";
import {
  renderListPageForm,
  renderSkillsForm,
  renderCustomPageForm,
  renderHomeForm,
  renderAboutForm,
  renderSiteSettingsForm,
  renderContactForm,
  renderProjectForm,
  renderProjectsIndexForm,
  SITE_SETTINGS_TABS,
  REPEATER_DEFAULTS,
  RESERVED_PAGE_SLUGS,
} from "./content-forms.js";

const PROJECT_PAGE_TEMPLATE = (slug) => `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Project – Saroj Shrestha</title>
  <link rel="icon" href="/img/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/css/style.css" />
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script>window.__PROJECT_SLUG__='${slug}';</script>
  <script>(function(){var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);})();</script>
</head>
<body data-page="project-detail">
  <header class="header"><div class="container header-inner"><a class="logo" href="/"><span class="logo-mark"></span><span data-site-name>saroj.dev</span></a><div class="menu-cont"><button class="menu-btn" type="button" aria-label="Open menu"><span></span><span></span></button><ul class="menubar" data-portfolio-nav-root><li data-portfolio-nav-insert><button class="soc theme-btn" type="button" aria-label="Toggle theme"><svg class="icon-lamp-off" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1Zm3-19a7 7 0 0 0-4 12.6V17h8v-2.4A7 7 0 0 0 12 2Z"/></svg><svg class="icon-lamp-on" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1Zm3-19a7 7 0 0 0-4 12.6V17h8v-2.4A7 7 0 0 0 12 2Z"/></svg></button></li><div class="social-rail animate-bounce-slower" data-social-rail></div></ul></div></div></header>
  <main class="container page" data-project-detail><p class="lead">Loading project…</p></main>
  <footer class="footer"><div class="container footer-inner"><div class="footer-brand"><div class="footer-top"><a class="logo" href="/"><span class="logo-mark"></span><span data-site-name>saroj.dev</span></a></div><p data-footer-blurb></p></div><div class="footer-media"><h3>Media</h3><ul class="media-links" data-footer-social></ul></div></div><p class="copyright" data-copyright></p></footer>
  <script src="/js/main.js"></script><script src="/js/portfolio.js"></script>
</body>
</html>
`;

const CUSTOM_PAGE_HTML = (slug) => `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page – Saroj Shrestha</title>
  <link rel="icon" href="/img/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/css/style.css" />
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script>window.__PAGE_SLUG__='${slug}';</script>
  <script>(function(){var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);})();</script>
</head>
<body data-page="custom-page">
  <header class="header"><div class="container header-inner"><a class="logo" href="/"><span class="logo-mark"></span><span data-site-name>saroj.dev</span></a><div class="menu-cont"><button class="menu-btn" type="button" aria-label="Open menu"><span></span><span></span></button><ul class="menubar" data-portfolio-nav-root><li data-portfolio-nav-insert><button class="soc theme-btn" type="button" aria-label="Toggle theme"><svg class="icon-lamp-off" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1Zm3-19a7 7 0 0 0-4 12.6V17h8v-2.4A7 7 0 0 0 12 2Z"/></svg><svg class="icon-lamp-on" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1Zm3-19a7 7 0 0 0-4 12.6V17h8v-2.4A7 7 0 0 0 12 2Z"/></svg></button></li><div class="social-rail animate-bounce-slower" data-social-rail></div></ul></div></div></header>
  <main class="container page" data-custom-page-root><p class="lead">Loading…</p></main>
  <footer class="footer"><div class="container footer-inner"><div class="footer-brand"><div class="footer-top"><a class="logo" href="/"><span class="logo-mark"></span><span data-site-name>saroj.dev</span></a></div><p data-footer-blurb></p></div><div class="footer-media"><h3>Media</h3><ul class="media-links" data-footer-social></ul></div></div><p class="copyright" data-copyright></p></footer>
  <script src="/js/main.js"></script><script src="/js/portfolio.js"></script>
</body>
</html>
`;

const state = {
  section: "content",
  selected: null,
  selectedRecycleId: null,
  tab: "content",
  docs: new Map(),
  media: null,
  dirty: false,
  loading: true,
  config: null,
  github: null,
  shas: new Map(),
  expandedProjects: true,
  expandedCustomPages: true,
};

const el = {
  app: document.getElementById("bo-app"),
  tree: document.getElementById("bo-tree"),
  editor: document.getElementById("bo-editor"),
  breadcrumb: document.getElementById("bo-breadcrumb"),
  statusPill: document.getElementById("bo-status-pill"),
  btnSave: document.getElementById("btn-save"),
  btnPublish: document.getElementById("btn-publish"),
  btnPreview: document.getElementById("btn-preview"),
  btnDelete: document.getElementById("btn-delete"),
  btnNewProject: document.getElementById("btn-new-project"),
  btnNewPage: document.getElementById("btn-new-page"),
  btnLogin: document.getElementById("btn-login"),
  btnLogout: document.getElementById("btn-logout"),
  btnCmsLock: document.getElementById("btn-cms-lock"),
  authLabel: document.getElementById("bo-auth-label"),
};

function toast(msg, ok = true) {
  const t = document.createElement("div");
  t.className = "bo-toast " + (ok ? "ok" : "err");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 5000);
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error("Could not load " + path);
  return res.json();
}

async function loadContent() {
  state.loading = true;
  render();
  const paths = [
    ["site-settings", "/content/site-settings.json"],
    ["home", "/content/home.json"],
    ["about", "/content/about.json"],
    ["contact", "/content/contact.json"],
    ["experience", "/content/experience.json"],
    ["education", "/content/education.json"],
    ["skills", "/content/skills.json"],
    ["certifications", "/content/certifications.json"],
    ["services", "/content/services.json"],
    ["projects-index", "/content/projects/index.json"],
    ["recycle-bin", "/content/recycle-bin/index.json"],
    ["pages-index", "/content/pages/index.json"],
  ];
  for (const [id, path] of paths) {
    let data;
    if (id === "recycle-bin") {
      try {
        data = await fetchJson(path);
      } catch {
        data = { status: "published", title: "Recycle bin", items: [] };
      }
    } else if (id === "pages-index") {
      try {
        data = await fetchJson(path);
      } catch {
        data = { status: "published", title: "Custom pages", slugs: [] };
      }
    } else {
      data = await fetchJson(path);
    }
    const kind =
      id === "projects-index"
        ? "projects-index"
        : id === "pages-index"
          ? "pages-index"
          : id === "recycle-bin"
            ? "recycle-bin"
            : "page";
    state.docs.set(id, {
      id,
      path: path.replace(/^\//, ""),
      repoPath: path.replace(/^\//, ""),
      data,
      kind,
    });
  }
  const index = state.docs.get("projects-index").data;
  for (const slug of index.slugs || []) {
    const path = `/content/projects/${slug}.json`;
    state.docs.set(`project:${slug}`, {
      id: `project:${slug}`,
      path,
      repoPath: `content/projects/${slug}.json`,
      data: await fetchJson(path),
      kind: "project",
      slug,
    });
  }
  const pagesIndex = state.docs.get("pages-index")?.data;
  for (const slug of pagesIndex?.slugs || []) {
    const path = `/content/pages/${slug}.json`;
    try {
      state.docs.set(`page:${slug}`, {
        id: `page:${slug}`,
        path,
        repoPath: `content/pages/${slug}.json`,
        data: await fetchJson(path),
        kind: "custom-page",
        slug,
      });
    } catch {
      /* orphan slug */
    }
  }
  state.media = await fetchJson("/content/media/index.json");
  state.loading = false;
  if (!state.selected) state.selected = "home";
  state.dirty = false;
  render();
}

function getSelectedDoc() {
  return state.selected ? state.docs.get(state.selected) : null;
}

function previewUrl(doc) {
  const base = state.config?.site_url || "";
  if (!doc) return base || "/";
  if (doc.id === "home") return base + "/";
  if (doc.id === "about") return base + "/about";
  if (doc.id === "contact") return base + "/contact";
  if (doc.id === "projects-index") return base + "/projects";
  if (doc.kind === "project") return base + "/projects/" + doc.slug;
  if (doc.kind === "custom-page") return base + "/" + doc.slug;
  if (doc.id === "experience") return base + "/experience";
  if (doc.id === "education") return base + "/education";
  if (doc.id === "skills") return base + "/skills";
  if (doc.id === "certifications") return base + "/certifications";
  if (doc.id === "services") return base + "/services";
  if (doc.id === "site-settings") return base + "/";
  return base + "/";
}

function validateDoc(doc) {
  if (!doc?.data) return "Missing document.";
  if (doc.kind === "project") {
    if (!doc.data.title?.trim()) return "Project title is required.";
    if (!doc.data.slug?.trim()) return "Project slug is required.";
  }
  if (doc.kind === "custom-page") {
    if (!doc.data.title?.trim()) return "Page title is required.";
    if (!doc.data.slug?.trim()) return "Page slug is required.";
    if (RESERVED_PAGE_SLUGS.has(doc.data.slug)) return "That slug is reserved. Pick another.";
  }
  return null;
}

function renderTree() {
  if (state.section === "recycle") {
    const bin = state.docs.get("recycle-bin")?.data;
    const items = bin?.items || [];
    let html = `<div class="bo-tree-head">Recycle bin</div><div class="bo-tree-scroll">`;
    if (!items.length) {
      html += `<div class="bo-tree-item">Empty</div>`;
    } else {
      for (const item of items) {
        const active = state.selectedRecycleId === item.id ? " active" : "";
        html += `<div class="bo-tree-item${active}" data-recycle-id="${escapeHtml(item.id)}">${escapeHtml(item.title || item.slug || item.id)}</div>`;
      }
    }
    html += `</div>`;
    el.tree.innerHTML = html;
    el.tree.querySelectorAll("[data-recycle-id]").forEach((node) => {
      node.addEventListener("click", () => {
        state.selectedRecycleId = node.dataset.recycleId;
        closeMobileTree();
        render();
      });
    });
    return;
  }
  if (state.section === "media") {
    el.tree.innerHTML = `<div class="bo-tree-head">Media</div><div class="bo-tree-scroll"><div class="bo-tree-item active">Portfolio images</div></div>`;
    return;
  }
  if (state.section === "settings") {
    el.tree.innerHTML = `<div class="bo-tree-head">Settings</div><div class="bo-tree-scroll"><div class="bo-tree-item${state.selected === "site-settings" ? " active" : ""}" data-id="site-settings">Site Settings</div></div>`;
    return;
  }

  const items = [
    ["home", "Home"],
    ["about", "About"],
    ["projects-folder", null],
    ["pages-folder", null],
    ["experience", "Experience"],
    ["education", "Education"],
    ["skills", "Skills"],
    ["certifications", "Certifications"],
    ["services", "Services"],
    ["contact", "Contact"],
    ["site-settings", "Site Settings"],
  ];

  let html = `<div class="bo-tree-head">Content</div><div class="bo-tree-scroll">`;
  for (const [id, label] of items) {
    if (id === "projects-folder") {
      html += `<div class="bo-tree-item${state.selected === "projects-index" ? " active" : ""}" data-id="projects-index"><button type="button" class="bo-tree-toggle" data-toggle-projects>${state.expandedProjects ? "▾" : "▸"}</button> Projects</div>`;
      if (state.expandedProjects) {
        const index = state.docs.get("projects-index")?.data;
        for (const slug of index?.slugs || []) {
          const pid = `project:${slug}`;
          const title = state.docs.get(pid)?.data?.title || slug;
          html += `<div class="bo-tree-item child${state.selected === pid ? " active" : ""}" data-id="${pid}">${escapeHtml(title)}</div>`;
        }
      }
      continue;
    }
    if (id === "pages-folder") {
      html += `<div class="bo-tree-item${state.selected === "pages-index" ? " active" : ""}" data-id="pages-index"><button type="button" class="bo-tree-toggle" data-toggle-pages>${state.expandedCustomPages ? "▾" : "▸"}</button> Pages</div>`;
      if (state.expandedCustomPages) {
        const pIndex = state.docs.get("pages-index")?.data;
        for (const slug of pIndex?.slugs || []) {
          const pid = `page:${slug}`;
          const title = state.docs.get(pid)?.data?.title || slug;
          html += `<div class="bo-tree-item child${state.selected === pid ? " active" : ""}" data-id="${pid}">${escapeHtml(title)}</div>`;
        }
      }
      continue;
    }
    html += `<div class="bo-tree-item${state.selected === id ? " active" : ""}" data-id="${id}">${label}</div>`;
  }
  html += `</div>`;
  el.tree.innerHTML = html;

  el.tree.querySelectorAll("[data-id]").forEach((node) => {
    node.addEventListener("click", () => {
      if (state.dirty && !confirm("Discard unsaved changes?")) return;
      const prevSelected = state.selected;
      state.selected = node.dataset.id;
      state.section = idSection(node.dataset.id);
      if (node.dataset.id === "site-settings" && prevSelected !== "site-settings") state.tab = "general";
      closeMobileTree();
      render();
    });
  });
  const toggle = el.tree.querySelector("[data-toggle-projects]");
  if (toggle) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      state.expandedProjects = !state.expandedProjects;
      renderTree();
    });
  }
  const togglePages = el.tree.querySelector("[data-toggle-pages]");
  if (togglePages) {
    togglePages.addEventListener("click", (e) => {
      e.stopPropagation();
      state.expandedCustomPages = !state.expandedCustomPages;
      renderTree();
    });
  }
}

function idSection(id) {
  if (id === "site-settings") return "settings";
  return "content";
}

function isMobileTreeLayout() {
  return window.matchMedia("(max-width: 960px)").matches;
}

function closeMobileTree() {
  el.tree?.classList.remove("is-open");
  const backdrop = document.getElementById("bo-tree-backdrop");
  backdrop?.classList.remove("is-visible");
  backdrop?.setAttribute("hidden", "");
  document.getElementById("btn-toggle-tree")?.setAttribute("aria-expanded", "false");
}

function openMobileTree() {
  if (!isMobileTreeLayout()) return;
  el.tree?.classList.add("is-open");
  const backdrop = document.getElementById("bo-tree-backdrop");
  backdrop?.classList.add("is-visible");
  backdrop?.removeAttribute("hidden");
  document.getElementById("btn-toggle-tree")?.setAttribute("aria-expanded", "true");
}

function wireMobileTree() {
  const btn = document.getElementById("btn-toggle-tree");
  const backdrop = document.getElementById("bo-tree-backdrop");
  btn?.addEventListener("click", () => {
    if (el.tree?.classList.contains("is-open")) closeMobileTree();
    else openMobileTree();
  });
  backdrop?.addEventListener("click", closeMobileTree);
  window.addEventListener(
    "resize",
    () => {
      if (!isMobileTreeLayout()) closeMobileTree();
    },
    { passive: true }
  );
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function field(label, key, value, type = "text", hint = "") {
  const v = value ?? "";
  if (type === "textarea") {
    return `<div class="bo-field"><label>${label}</label><textarea data-key="${key}">${escapeHtml(v)}</textarea>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
  }
  if (type === "select-status") {
    return `<div class="bo-field"><label>${label}</label><select data-key="${key}"><option value="published"${v === "published" ? " selected" : ""}>Published</option><option value="draft"${v === "draft" ? " selected" : ""}>Draft</option></select></div>`;
  }
  if (type === "checkbox") {
    return `<div class="bo-field"><label><input type="checkbox" data-key="${key}" data-bool="1"${v ? " checked" : ""} /> ${label}</label></div>`;
  }
  if (type === "image") {
    return imageFieldHtml(label, key, v, hint, escapeHtml);
  }
  return `<div class="bo-field"><label>${label}</label><input data-key="${key}" value="${escapeHtml(v)}" />${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
}

function imageField(label, key, value, hint = "") {
  return field(label, key, value, "image", hint);
}

function wireRepeaters(form, doc) {
  form.querySelectorAll("[data-add-repeater]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.addRepeater;
      if (kind === "skills") {
        if (!doc.data.columns) doc.data.columns = [];
        doc.data.columns.push({ title: "", items: [] });
      } else if (kind === "navigation") {
        if (!doc.data.navigation) doc.data.navigation = [];
        doc.data.navigation.push({ label: "", href: "/" });
      } else if (kind === "social") {
        if (!doc.data.social) doc.data.social = [];
        doc.data.social.push({ id: "", label: "", url: "", display: "" });
      } else if (kind === "biography") {
        if (!doc.data.biography) doc.data.biography = [];
        doc.data.biography.push("");
      } else if (REPEATER_DEFAULTS[kind]) {
        if (!doc.data.items) doc.data.items = [];
        doc.data.items.push(JSON.parse(JSON.stringify(REPEATER_DEFAULTS[kind])));
      }
      state.dirty = true;
      render();
    });
  });
  form.querySelectorAll("[data-remove-item]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".bo-repeater-card");
      const idx = Number(card?.dataset.itemIndex);
      const repeater = btn.closest("[data-repeater]");
      const kind = repeater?.dataset.repeater;
      if (Number.isNaN(idx)) return;
      if (kind === "skills" && doc.data.columns) doc.data.columns.splice(idx, 1);
      else if (kind === "navigation" && doc.data.navigation) doc.data.navigation.splice(idx, 1);
      else if (kind === "social" && doc.data.social) doc.data.social.splice(idx, 1);
      else if (kind === "biography" && doc.data.biography) doc.data.biography.splice(idx, 1);
      else if (doc.data.items) doc.data.items.splice(idx, 1);
      state.dirty = true;
      render();
    });
  });
}

function syncCustomPageNavigation(doc) {
  if (doc.kind !== "custom-page") return false;
  const settings = state.docs.get("site-settings");
  if (!settings) return false;
  const href = "/" + doc.data.slug;
  const label = (doc.data.navLabel || doc.data.title || doc.data.slug || "").trim();
  const nav = settings.data.navigation || [];
  const idx = nav.findIndex((n) => n.href === href);
  let changed = false;
  if (doc.data.showInNav) {
    if (idx < 0) {
      nav.push({ label: label || doc.data.slug, href });
      changed = true;
    } else if (nav[idx].label !== label) {
      nav[idx].label = label || doc.data.slug;
      changed = true;
    }
  } else if (idx >= 0) {
    nav.splice(idx, 1);
    changed = true;
  }
  if (changed) settings.data.navigation = nav;
  return changed;
}

function wireEditorForm(form, doc) {
  bindEditor(form, doc);
  wireImagePickers(form, doc, () => state.media?.items, (key, path) => {
    setDeep(doc.data, key, path);
    state.dirty = true;
    updateStatusPill(doc.data.status);
    el.btnSave.disabled = !state.github?.isAuthenticated();
    render();
  });
  wireRepeaters(form, doc);
  form.querySelectorAll("[data-key$='._technologies'], [data-key='_technologies']").forEach((input) => {
    input.addEventListener("input", (e) => {
      const docRef = getSelectedDoc();
      if (!docRef) return;
      docRef.data.technologies = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
      state.dirty = true;
    });
  });
  form.querySelectorAll("[data-key$='._achievements']").forEach((input) => {
    input.addEventListener("input", (e) => {
      const m = e.target.dataset.key.match(/^items\.(\d+)\._achievements$/);
      if (!m) return;
      const item = doc.data.items?.[Number(m[1])];
      if (item) item.achievements = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
      state.dirty = true;
    });
  });
  form.querySelectorAll("[data-key$='._items']").forEach((input) => {
    input.addEventListener("input", (e) => {
      const m = e.target.dataset.key.match(/^columns\.(\d+)\._items$/);
      if (!m) return;
      const col = doc.data.columns?.[Number(m[1])];
      if (col) col.items = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
      state.dirty = true;
    });
  });
  form.querySelector("[data-key='_paragraphs']")?.addEventListener("input", (e) => {
    doc.data.paragraphs = e.target.value.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
    state.dirty = true;
  });
  form.querySelector("[data-key='_featuredSlugs']")?.addEventListener("input", (e) => {
    doc.data.featuredProjectSlugs = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
    state.dirty = true;
  });
  form.querySelector("[data-key='_slugOrder']")?.addEventListener("input", (e) => {
    doc.data.slugs = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
    state.dirty = true;
  });
  form.querySelector("[data-key='_gallery']")?.addEventListener("input", (e) => {
    doc.data.gallery = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
    state.dirty = true;
  });
  form.querySelector("[data-key='workSection._tags']")?.addEventListener("input", (e) => {
    if (!doc.data.workSection) doc.data.workSection = {};
    doc.data.workSection.tags = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
    state.dirty = true;
  });
  form.querySelector("[data-key='lifeSection._tags']")?.addEventListener("input", (e) => {
    if (!doc.data.lifeSection) doc.data.lifeSection = {};
    doc.data.lifeSection.tags = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
    state.dirty = true;
  });
  if (doc.id === "site-settings") {
    const refreshBrand = () => {
      if (!doc.data.cmsBranding) doc.data.cmsBranding = {};
      applyCmsBranding(doc.data);
    };
    form.querySelectorAll("[data-key]").forEach((input) => {
      input.addEventListener("input", refreshBrand);
      input.addEventListener("change", refreshBrand);
    });
    refreshBrand();
  }
}

function bindEditor(form, doc) {
  form.querySelectorAll("[data-key]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.key;
      let val;
      if (input.dataset.bool) val = input.checked;
      else val = input.value;
      setDeep(doc.data, key, val);
      state.dirty = true;
      updateStatusPill(doc.data.status);
      el.btnSave.disabled = !state.github?.isAuthenticated();
      el.btnPublish.disabled = !state.github?.isAuthenticated();
    });
  });
}

function setDeep(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    if (/^\d+$/.test(nextKey)) {
      if (!Array.isArray(cur[key])) cur[key] = [];
    } else if (cur[key] == null) {
      cur[key] = {};
    }
    cur = cur[key];
  }
  const last = parts[parts.length - 1];
  if (Array.isArray(cur) && /^\d+$/.test(last)) cur[Number(last)] = value;
  else cur[last] = value;
}

function renderEditorForm(doc) {
  if (state.section === "media") {
    const items = state.media?.items || [];
    return `<h2>Media library</h2><p class="hint">Images live in <code>/img</code>. Upload commits a file to GitHub when signed in.</p>
      <div class="bo-field"><label>Upload image</label><input type="file" id="media-upload" accept="image/*" /></div>
      <div class="bo-media-grid">${items.map((m) => `<div class="bo-media-card" title="${escapeHtml(m.path)}"><img src="${escapeHtml(m.path)}" alt="" /><p>${escapeHtml(m.name)}</p></div>`).join("")}</div>`;
  }

  const d = doc.data;
  if (doc.id === "home") return renderHomeForm(d, field, imageField);
  if (doc.id === "about") return renderAboutForm(d, field, imageField, escapeHtml);
  if (doc.kind === "project") {
    const visHint =
      d.status === "draft"
        ? `<p class="hint"><strong>Public site:</strong> Draft projects are hidden on <code>/projects</code>. Sign in with GitHub, then <strong>Save</strong> and <strong>Publish</strong>.</p>`
        : `<p class="hint"><strong>Public site:</strong> Published projects appear on <code>/projects</code> after Save.</p>`;
    return `${visHint}<h2>Project</h2>${renderProjectForm(d, field, imageField)}`;
  }
  if (doc.kind === "custom-page") return renderCustomPageForm(d, field, imageField);
  if (doc.id === "site-settings") {
    const tab = SITE_SETTINGS_TABS.some((t) => t.id === state.tab) ? state.tab : "general";
    if (tab === "info") return null;
    return renderSiteSettingsForm(d, field, imageField, escapeHtml, tab);
  }
  if (doc.id === "skills") return renderSkillsForm(d, field, imageField, escapeHtml);
  const listForm = renderListPageForm(doc, field, escapeHtml);
  if (listForm) return listForm;
  if (doc.id === "contact") return renderContactForm(d, field);
  if (doc.id === "pages-index") {
    const slugList = (d.slugs || []).join("\n");
    return `<h2>Custom pages</h2>
      <p class="hint">Use <strong>New page</strong> in the toolbar. Each page gets a URL like <code>/your-slug</code>.</p>
      ${field("Status", "status", d.status, "select-status")}
      <div class="bo-field"><label>Page slugs (read-only)</label><textarea readonly tabindex="-1" style="font-family:monospace;min-height:100px;background:#f4f6f8">${escapeHtml(slugList || "(none yet)")}</textarea></div>`;
  }
  if (doc.id === "projects-index") return renderProjectsIndexForm(d, field, escapeHtml);
  return `<h2>${escapeHtml(doc.id)}</h2><p class="hint">This document has no editor yet. Try reloading the CMS (Ctrl+F5).</p>`;
}

function renderInfoPanel(doc) {
  const preview = previewUrl(doc);
  const onSite =
    doc.data?.status === "published"
      ? "Visible on the public site after GitHub Pages finishes deploying."
      : "Hidden on the public site while status is Draft.";
  return `<div class="bo-info"><h2>Info</h2>
    <dl class="bo-info-dl">
      <dt>Document</dt><dd>${escapeHtml(doc.id)}</dd>
      <dt>Kind</dt><dd>${escapeHtml(doc.kind || "page")}</dd>
      <dt>Repository path</dt><dd><code>${escapeHtml(doc.repoPath || "—")}</code></dd>
      <dt>Status</dt><dd>${escapeHtml(doc.data?.status || "—")}</dd>
      ${doc.slug ? `<dt>Slug</dt><dd><code>${escapeHtml(doc.slug)}</code></dd>` : ""}
      <dt>Public site</dt><dd>${onSite}</dd>
      <dt>Preview URL</dt><dd>${preview ? `<a href="${escapeHtml(preview)}" target="_blank" rel="noreferrer">${escapeHtml(preview)}</a>` : "—"}</dd>
      <dt>Unsaved changes</dt><dd>${state.dirty ? "Yes" : "No"}</dd>
    </dl></div>`;
}

function renderMediaInfoPanel() {
  const count = state.media?.items?.length ?? 0;
  return `<div class="bo-info"><h2>Info</h2>
    <dl class="bo-info-dl">
      <dt>Section</dt><dd>Media library</dd>
      <dt>Index file</dt><dd><code>content/media/index.json</code></dd>
      <dt>Items</dt><dd>${count}</dd>
      <dt>Upload</dt><dd>Requires GitHub sign-in; files go to <code>/img</code>.</dd>
    </dl></div>`;
}

function renderRecyclePanel() {
  const bin = state.docs.get("recycle-bin")?.data;
  const items = bin?.items || [];
  el.breadcrumb.textContent = "Recycle bin";
  el.statusPill.textContent = "";
  if (!items.length) {
    el.editor.innerHTML = `<div class="bo-editor"><h2>Recycle bin</h2><p class="hint">Deleted projects are stored here. You can restore them or remove them permanently.</p><p class="bo-empty">Nothing in the recycle bin.</p></div>`;
    return;
  }
  const selected = items.find((i) => i.id === state.selectedRecycleId) || items[0];
  state.selectedRecycleId = selected?.id ?? null;
  const list = items
    .map((item) => {
      return `<li class="bo-recycle-item">
        <div>
          <strong>${escapeHtml(item.title || item.slug)}</strong>
          <div class="bo-recycle-meta">${escapeHtml(item.type || "project")} · ${escapeHtml(item.slug || "")} · deleted ${escapeHtml(item.deletedAt?.slice(0, 10) || "?")}</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button type="button" class="bo-btn" data-restore="${escapeHtml(item.id)}">Restore</button>
          <button type="button" class="bo-btn danger" data-purge="${escapeHtml(item.id)}">Delete forever</button>
        </div>
      </li>`;
    })
    .join("");
  el.editor.innerHTML = `<div class="bo-editor"><h2>Recycle bin</h2><p class="hint">Restore puts the project back in Content. Delete forever removes the backup from Git.</p>
    <ul class="bo-recycle-list">${list}</ul>
    ${selected ? `<div class="bo-field" style="margin-top:20px"><label>Stored JSON preview</label><textarea readonly style="min-height:160px;font-family:monospace;font-size:12px">${escapeHtml(JSON.stringify(selected.data, null, 2))}</textarea></div>` : ""}
  </div>`;
  el.editor.querySelectorAll("[data-restore]").forEach((btn) => {
    btn.addEventListener("click", () => restoreFromRecycleBin(btn.dataset.restore));
  });
  el.editor.querySelectorAll("[data-purge]").forEach((btn) => {
    btn.addEventListener("click", () => purgeFromRecycleBin(btn.dataset.purge));
  });
}

const DEFAULT_DOC_TABS = [
  { id: "content", label: "Content" },
  { id: "info", label: "Info" },
];

function normalizeTabForDoc(doc) {
  if (doc?.id === "site-settings") {
    if (!SITE_SETTINGS_TABS.some((t) => t.id === state.tab)) state.tab = "general";
  } else if (state.section === "media") {
    if (state.tab !== "content" && state.tab !== "info") state.tab = "content";
  } else if (doc) {
    if (state.tab !== "content" && state.tab !== "info") state.tab = "content";
  }
}

function syncTabUi() {
  const tabsWrap = document.getElementById("bo-tabs");
  if (!tabsWrap) return;
  const doc = getSelectedDoc();
  const showTabs = state.section === "content" || state.section === "settings" || state.section === "media";
  tabsWrap.style.display = showTabs ? "" : "none";
  if (!showTabs) return;

  normalizeTabForDoc(doc);
  const tabs =
    doc?.id === "site-settings" || state.section === "settings"
      ? SITE_SETTINGS_TABS
      : DEFAULT_DOC_TABS;

  tabsWrap.innerHTML = tabs
    .map(
      (t) =>
        `<button type="button" class="bo-tab${state.tab === t.id ? " active" : ""}" role="tab" data-tab="${t.id}">${t.label}</button>`
    )
    .join("");
}

function renderEditor() {
  syncTabUi();
  if (state.loading) {
    el.editor.innerHTML = `<div class="bo-empty">Loading content…</div>`;
    return;
  }
  if (state.section === "recycle") {
    renderRecyclePanel();
    return;
  }
  if (state.section === "media") {
    el.breadcrumb.textContent = "Media / Portfolio";
    el.statusPill.textContent = "";
    if (state.tab === "info") {
      el.editor.innerHTML = `<div class="bo-editor">${renderMediaInfoPanel()}</div>`;
      return;
    }
    el.editor.innerHTML = `<form class="bo-editor" id="bo-form">${renderEditorForm(null)}</form>`;
    wireMediaUpload();
    return;
  }
  const doc = getSelectedDoc();
  if (!doc) {
    el.editor.innerHTML = `<div class="bo-empty">Select a content node from the tree.</div>`;
    return;
  }
  const crumbSection =
    state.section === "settings" || doc.id === "site-settings" ? "Settings" : "Content";
  const tabLabel =
    doc.id === "site-settings"
      ? SITE_SETTINGS_TABS.find((t) => t.id === state.tab)?.label
      : state.tab === "info"
        ? "Info"
        : "Content";
  el.breadcrumb.textContent = `${crumbSection} / ${doc.id}${tabLabel ? " / " + tabLabel : ""}`;
  updateStatusPill(doc.data.status);
  if (state.tab === "info") {
    el.editor.innerHTML = `<div class="bo-editor">${renderInfoPanel(doc)}</div>`;
    return;
  }
  const formHtml = renderEditorForm(doc);
  if (formHtml === null) {
    el.editor.innerHTML = `<div class="bo-editor">${renderInfoPanel(doc)}</div>`;
    return;
  }
  el.editor.innerHTML = `<form class="bo-editor" id="bo-form">${formHtml}</form>`;
  wireEditorForm(document.getElementById("bo-form"), doc);
}

function updateStatusPill(status) {
  el.statusPill.textContent = status === "draft" ? "Draft" : "Published";
  el.statusPill.className = "bo-status-pill" + (status === "draft" ? " draft" : "");
}

function wireMediaUpload() {
  const input = document.getElementById("media-upload");
  if (!input) return;
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!state.github?.isAuthenticated()) {
      toast("Sign in with GitHub to upload images.", false);
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      const repoPath = `img/${file.name}`;
      await state.github.putBinaryFile(repoPath, base64, `CMS: upload ${file.name}`);
      state.media.items.push({ id: file.name, name: file.name, path: "/" + repoPath, folder: "portfolio" });
      await commitDoc({ id: "media", repoPath: "content/media/index.json", data: state.media }, "CMS: update media index");
      toast("Image uploaded.");
      await loadContent();
    } catch (err) {
      toast(err.message, false);
    }
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function render() {
  renderTree();
  renderEditor();
  const editingDoc = state.section !== "recycle" && getSelectedDoc();
  const toolbarOn = state.section !== "recycle";
  el.btnSave.style.display = toolbarOn ? "" : "none";
  el.btnPublish.style.display = toolbarOn ? "" : "none";
  el.btnPreview.style.display = toolbarOn ? "" : "none";
  el.btnNewProject.style.display = state.section === "content" ? "" : "none";
  el.btnSave.disabled = !state.dirty || !state.github?.isAuthenticated();
  el.btnPublish.disabled = !state.github?.isAuthenticated() || !editingDoc;
  const canRecycle = editingDoc?.kind === "project" || editingDoc?.kind === "custom-page";
  el.btnDelete.style.display = canRecycle ? "" : "none";
  if (el.btnDelete && canRecycle) el.btnDelete.textContent = "Move to recycle bin";
  if (el.btnNewPage) el.btnNewPage.style.display = state.section === "content" ? "" : "none";
}

function wireRail() {
  document.querySelectorAll("[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.section = btn.dataset.section;
      if (state.section === "settings") {
        state.selected = "site-settings";
        state.tab = "general";
      }
      if (state.section === "media") state.selected = null;
      if (state.section === "recycle") {
        state.selected = null;
        state.selectedRecycleId = null;
      }
      document.querySelectorAll("[data-section]").forEach((b) => b.classList.toggle("active", b === btn));
      if (isMobileTreeLayout() && state.section !== "content") openMobileTree();
      else if (state.section === "content") closeMobileTree();
      render();
    });
  });
}

function wireTabs() {
  const tabsWrap = document.getElementById("bo-tabs");
  if (!tabsWrap || tabsWrap.dataset.wired) return;
  tabsWrap.dataset.wired = "1";
  tabsWrap.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (!tab) return;
    state.tab = tab.dataset.tab;
    render();
  });
}

async function commitDoc(doc, message) {
  const text = JSON.stringify(doc.data, null, 2) + "\n";
  const repoPath = doc.repoPath;
  const res = await state.github.putFile(repoPath, text, message);
  if (res?.content?.sha) state.shas.set(repoPath, res.content.sha);
}

async function saveSelected() {
  const doc = getSelectedDoc();
  if (!doc) return;
  const err = validateDoc(doc);
  if (err) {
    toast(err, false);
    return;
  }
  if (!state.github?.isAuthenticated()) {
    toast("Sign in with GitHub to save.", false);
    return;
  }
  try {
    el.btnSave.disabled = true;
    await commitDoc(doc, `CMS: update ${doc.id}`);
    if (doc.kind === "project") {
      await state.github.putFile(`projects/${doc.slug}/index.html`, PROJECT_PAGE_TEMPLATE(doc.slug), `CMS: sync project page ${doc.slug}`);
      const index = state.docs.get("projects-index");
      if (index) await commitDoc(index, `CMS: sync project index (${doc.slug})`);
    }
    if (doc.kind === "custom-page") {
      await state.github.putFile(`${doc.slug}.html`, CUSTOM_PAGE_HTML(doc.slug), `CMS: sync page ${doc.slug}`);
      const pagesIndex = state.docs.get("pages-index");
      if (pagesIndex) await commitDoc(pagesIndex, `CMS: sync pages index (${doc.slug})`);
      if (syncCustomPageNavigation(doc)) {
        const settings = state.docs.get("site-settings");
        if (settings) await commitDoc(settings, `CMS: sync nav for ${doc.slug}`);
      }
    }
    if (doc.id === "site-settings") {
      applyCmsBranding(doc.data);
    }
    state.dirty = false;
    const saved = getSelectedDoc();
    if (saved?.kind === "project" && saved.data.status === "draft") {
      toast("Saved. Project is still Draft — click Publish to show it on /projects.");
    } else if (saved?.kind === "custom-page" && saved.data.status === "draft") {
      toast("Saved. Page is Draft — Publish to show it on the live site.");
    } else {
      toast("Saved to GitHub. Site will update after GitHub Pages deploys.");
    }
  } catch (e) {
    const msg = String(e.message);
    if (msg.includes("409")) {
      toast("Save conflict — reload /cms/ and try Save again (file changed on GitHub).", false);
    } else {
      toast(msg, false);
    }
  } finally {
    render();
  }
}

async function publishSelected() {
  const doc = getSelectedDoc();
  if (!doc) return;
  doc.data.status = "published";
  state.dirty = true;
  updateStatusPill("published");
  await saveSelected();
}

function getRecycleBinData() {
  return state.docs.get("recycle-bin")?.data;
}

async function commitRecycleBin(message) {
  const doc = state.docs.get("recycle-bin");
  if (!doc) return;
  await commitDoc(doc, message);
}

async function deleteSelectedContent() {
  const doc = getSelectedDoc();
  if (!doc || (doc.kind !== "project" && doc.kind !== "custom-page")) return;
  if (
    !confirm(
      `Move “${doc.data.title}” to the recycle bin? It will disappear from the public site; you can restore it from the Recycle bin section.`
    )
  )
    return;
  if (!state.github?.isAuthenticated()) {
    toast("Sign in with GitHub to delete.", false);
    return;
  }
  try {
    const bin = getRecycleBinData();
    if (!bin.items) bin.items = [];
    bin.items.unshift({
      id: `${Date.now()}-${doc.slug}`,
      deletedAt: new Date().toISOString(),
      type: doc.kind === "custom-page" ? "page" : "project",
      slug: doc.slug,
      title: doc.data.title,
      data: JSON.parse(JSON.stringify(doc.data)),
    });
    await commitRecycleBin(`CMS: recycle ${doc.slug}`);

    if (doc.kind === "project") {
      const index = state.docs.get("projects-index");
      index.data.slugs = (index.data.slugs || []).filter((s) => s !== doc.slug);
      await commitDoc(index, `CMS: remove slug ${doc.slug}`);
      try {
        await state.github.deleteFile(doc.repoPath, `CMS: remove project json ${doc.slug}`);
      } catch {
        /* never saved */
      }
      try {
        await state.github.deleteFile(`projects/${doc.slug}/index.html`, `CMS: remove project page ${doc.slug}`);
      } catch {
        /* optional */
      }
      state.selected = "projects-index";
    } else {
      const pagesIndex = state.docs.get("pages-index");
      pagesIndex.data.slugs = (pagesIndex.data.slugs || []).filter((s) => s !== doc.slug);
      await commitDoc(pagesIndex, `CMS: remove page slug ${doc.slug}`);
      doc.data.showInNav = false;
      syncCustomPageNavigation(doc);
      const settings = state.docs.get("site-settings");
      if (settings) await commitDoc(settings, `CMS: remove nav ${doc.slug}`);
      try {
        await state.github.deleteFile(doc.repoPath, `CMS: remove page json ${doc.slug}`);
      } catch {
        /* */
      }
      try {
        await state.github.deleteFile(`${doc.slug}.html`, `CMS: remove page html ${doc.slug}`);
      } catch {
        /* */
      }
      state.selected = "pages-index";
    }

    toast("Moved to recycle bin.");
    state.dirty = false;
    await loadContent();
  } catch (e) {
    toast(e.message, false);
  }
}

async function restoreFromRecycleBin(itemId) {
  if (!state.github?.isAuthenticated()) {
    toast("Sign in with GitHub to restore.", false);
    return;
  }
  const bin = getRecycleBinData();
  const idx = (bin?.items || []).findIndex((i) => i.id === itemId);
  if (idx < 0) return;
  const item = bin.items[idx];
  if (!item.slug || !item.data) {
    toast("Unsupported recycle item.", false);
    return;
  }
  if (item.type === "page") {
    if (state.docs.has(`page:${item.slug}`)) {
      toast("A page with this slug already exists.", false);
      return;
    }
    if (!confirm(`Restore page “${item.title || item.slug}”?`)) return;
    try {
      const pagesIndex = state.docs.get("pages-index");
      pagesIndex.data.slugs = [...(pagesIndex.data.slugs || []), item.slug];
      const pageDoc = {
        id: `page:${item.slug}`,
        kind: "custom-page",
        slug: item.slug,
        repoPath: `content/pages/${item.slug}.json`,
        data: JSON.parse(JSON.stringify(item.data)),
      };
      await commitDoc(pageDoc, `CMS: restore page ${item.slug}`);
      await state.github.putFile(`${item.slug}.html`, CUSTOM_PAGE_HTML(item.slug), `CMS: restore page html ${item.slug}`);
      await commitDoc(pagesIndex, `CMS: restore page slug ${item.slug}`);
      if (syncCustomPageNavigation(pageDoc)) {
        const settings = state.docs.get("site-settings");
        if (settings) await commitDoc(settings, `CMS: restore nav ${item.slug}`);
      }
      bin.items.splice(idx, 1);
      await commitRecycleBin(`CMS: remove ${item.slug} from recycle bin`);
      toast("Page restored.");
      state.section = "content";
      state.selected = `page:${item.slug}`;
      await loadContent();
    } catch (e) {
      toast(e.message, false);
    }
    return;
  }
  if (item.type !== "project") {
    toast("Unsupported recycle item.", false);
    return;
  }
  if (state.docs.has(`project:${item.slug}`)) {
    toast("A project with this slug already exists.", false);
    return;
  }
  if (!confirm(`Restore project “${item.title || item.slug}”?`)) return;
  try {
    const index = state.docs.get("projects-index");
    index.data.slugs = [...(index.data.slugs || []), item.slug];
    const projectDoc = {
      id: `project:${item.slug}`,
      kind: "project",
      slug: item.slug,
      repoPath: `content/projects/${item.slug}.json`,
      data: JSON.parse(JSON.stringify(item.data)),
    };
    await commitDoc(projectDoc, `CMS: restore project ${item.slug}`);
    await state.github.putFile(
      `projects/${item.slug}/index.html`,
      PROJECT_PAGE_TEMPLATE(item.slug),
      `CMS: restore project page ${item.slug}`
    );
    await commitDoc(index, `CMS: restore slug ${item.slug}`);
    bin.items.splice(idx, 1);
    await commitRecycleBin(`CMS: remove ${item.slug} from recycle bin`);
    toast("Project restored.");
    state.section = "content";
    state.selected = `project:${item.slug}`;
    await loadContent();
  } catch (e) {
    toast(e.message, false);
  }
}

async function purgeFromRecycleBin(itemId) {
  if (!state.github?.isAuthenticated()) {
    toast("Sign in with GitHub.", false);
    return;
  }
  const bin = getRecycleBinData();
  const item = (bin?.items || []).find((i) => i.id === itemId);
  if (!item) return;
  if (!confirm(`Permanently delete backup for “${item.title || item.slug}”? This cannot be undone.`)) return;
  try {
    bin.items = bin.items.filter((i) => i.id !== itemId);
    await commitRecycleBin(`CMS: purge recycle item ${itemId}`);
    toast("Removed from recycle bin.");
    state.selectedRecycleId = null;
    await loadContent();
  } catch (e) {
    toast(e.message, false);
  }
}

function createCustomPage() {
  const title = prompt("Page title");
  if (!title) return;
  let slug = prompt(
    "URL slug (e.g. game)",
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  );
  if (!slug) return;
  if (RESERVED_PAGE_SLUGS.has(slug) || state.docs.has(`page:${slug}`) || state.docs.has(`project:${slug}`)) {
    toast("That slug is taken or reserved.", false);
    return;
  }
  const showNav = confirm("Add this page to the main navigation menu?");
  const data = {
    status: "draft",
    slug,
    title,
    subtitle: "",
    heroImage: "",
    paragraphs: ["Edit this page in the CMS."],
    navLabel: title,
    showInNav: showNav,
  };
  state.docs.set(`page:${slug}`, {
    id: `page:${slug}`,
    kind: "custom-page",
    slug,
    repoPath: `content/pages/${slug}.json`,
    data,
  });
  const index = state.docs.get("pages-index");
  index.data.slugs = [...(index.data.slugs || []), slug];
  state.selected = `page:${slug}`;
  state.dirty = true;
  state.expandedCustomPages = true;
  state.tab = "content";
  render();
  toast("Page created as Draft. Save, then Publish, to show it on the live site.", true);
}

function createProject() {
  const title = prompt("Project title");
  if (!title) return;
  let slug = prompt("URL slug (e.g. my-project)", title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  if (!slug) return;
  if (state.docs.has(`project:${slug}`)) {
    toast("Slug already exists.", false);
    return;
  }
  const data = {
    status: "draft",
    slug,
    title,
    category: "main-work",
    description: "",
    longDescription: "",
    thumbnail: "",
    gallery: [],
    technologies: [],
    githubUrl: "",
    demoUrl: "",
    featured: false,
  };
  state.docs.set(`project:${slug}`, { id: `project:${slug}`, kind: "project", slug, repoPath: `content/projects/${slug}.json`, data });
  const index = state.docs.get("projects-index");
  index.data.slugs = [...(index.data.slugs || []), slug];
  state.selected = `project:${slug}`;
  state.dirty = true;
  state.expandedProjects = true;
  state.tab = "content";
  render();
  toast(
    "Project created as Draft. Sign in with GitHub, Save, then Publish to show it on /projects.",
    true
  );
}

function updateAuthUi() {
  const oauthReady = isOAuthConfigured(state.config);
  const authed = state.github?.isAuthenticated();
  if (authed) {
    el.authLabel.textContent = "Signed in to GitHub";
  } else if (!oauthReady) {
    el.authLabel.textContent = "Sign-in not configured — edit cms/config.public.json";
  } else {
    el.authLabel.textContent = "Not signed in";
  }
  el.btnLogin.style.display = authed ? "none" : "";
  el.btnLogin.disabled = !oauthReady;
  el.btnLogin.title = oauthReady ? "Sign in with GitHub to save changes" : "Add OAuth proxy URL and Client ID to cms/config.public.json, then push to GitHub";
  el.btnLogout.style.display = authed ? "" : "none";
}

async function initAuth() {
  state.config = await loadCmsConfig();
  state.github = state.config ? new GitHubClient(state.config) : null;
  el.app?.removeAttribute("hidden");
  updateAuthUi();
}

async function main() {
  await fetchAndApplyCmsBranding();
  await ensureCmsAccess();
  const cfg = await loadCmsConfig();
  const gateOn =
    cfg?.cmsAccess?.passwordSha256 &&
    !String(cfg.cmsAccess.passwordSha256).includes("YOUR_");
  if (!gateOn && el.btnCmsLock) el.btnCmsLock.style.display = "none";
  wireRail();
  wireTabs();
  wireMobileTree();
  el.btnCmsLock?.addEventListener("click", () => {
    clearCmsSession();
    location.reload();
  });
  el.btnSave.addEventListener("click", saveSelected);
  el.btnPublish.addEventListener("click", publishSelected);
  el.btnPreview.addEventListener("click", () => {
    const url = previewUrl(getSelectedDoc());
    if (url) window.open(url, "_blank");
  });
  el.btnDelete.addEventListener("click", deleteSelectedContent);
  el.btnNewProject.addEventListener("click", createProject);
  el.btnNewPage?.addEventListener("click", createCustomPage);
  el.btnLogin?.addEventListener("click", () => {
    try {
      state.github.login();
    } catch (e) {
      toast(e.message, false);
    }
  });
  el.btnLogout?.addEventListener("click", () => {
    state.github?.setToken(null);
    updateAuthUi();
    render();
  });

  await initAuth();
  await loadContent();
  applyCmsBranding(state.docs.get("site-settings")?.data);
}

main().catch((err) => {
  console.error("CMS failed to start:", err);
  const box = document.getElementById("bo-editor");
  if (box) {
    box.innerHTML = `<div class="bo-empty"><p><strong>CMS failed to load.</strong></p><p>${err.message}</p><p>Hard-refresh (Ctrl+F5) or check the browser console.</p></div>`;
  }
  toast(err.message, false);
});
