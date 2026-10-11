import { GitHubClient, loadCmsConfig, isOAuthConfigured } from "./github-client.js";
import { ensureCmsAccess, clearCmsSession } from "./auth-gate.js";

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

const state = {
  section: "content",
  selected: null,
  tab: "content",
  docs: new Map(),
  media: null,
  dirty: false,
  loading: true,
  config: null,
  github: null,
  shas: new Map(),
  expandedProjects: true,
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
  ];
  for (const [id, path] of paths) {
    state.docs.set(id, { id, path: path.replace(/^\//, ""), repoPath: path.replace(/^\//, ""), data: await fetchJson(path), kind: id === "projects-index" ? "projects-index" : "page" });
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
  return null;
}

function renderTree() {
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
    html += `<div class="bo-tree-item${state.selected === id ? " active" : ""}" data-id="${id}">${label}</div>`;
  }
  html += `</div>`;
  el.tree.innerHTML = html;

  el.tree.querySelectorAll("[data-id]").forEach((node) => {
    node.addEventListener("click", () => {
      if (state.dirty && !confirm("Discard unsaved changes?")) return;
      state.selected = node.dataset.id;
      state.section = idSection(node.dataset.id);
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
}

function idSection(id) {
  if (id === "site-settings") return "settings";
  return "content";
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
  return `<div class="bo-field"><label>${label}</label><input data-key="${key}" value="${escapeHtml(v)}" />${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
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
  if (doc.id === "home") {
    return `<h2>Home</h2>${field("Status", "status", d.status, "select-status")}
      ${field("Heading", "hero.heading", d.hero?.heading)}${field("Heading accent", "hero.headingAccent", d.hero?.headingAccent)}
      ${field("Subtitle", "hero.subtitle", d.hero?.subtitle, "textarea")}${field("Profile image path", "hero.profileImage", d.hero?.profileImage)}
      ${field("CTA label", "hero.cta.label", d.hero?.cta?.label)}${field("CTA link", "hero.cta.href", d.hero?.cta?.href)}
      ${field("Quote", "quote.text", d.quote?.text, "textarea")}${field("About snippet (para 1)", "aboutSnippet.paragraphs.0", d.aboutSnippet?.paragraphs?.[0], "textarea")}`;
  }
  if (doc.id === "about") {
    return `<h2>About</h2>${field("Status", "status", d.status, "select-status")}${field("Page heading", "heading", d.heading)}${field("Biography (paragraph 1)", "biography.0", d.biography?.[0], "textarea")}${field("Biography (paragraph 2)", "biography.1", d.biography?.[1], "textarea")}${field("Biography (paragraph 3)", "biography.2", d.biography?.[2], "textarea")}`;
  }
  if (doc.kind === "project") {
    return `<h2>Project</h2>${field("Status", "status", d.status, "select-status")}${field("Title", "title", d.title)}${field("Slug", "slug", d.slug, "text", "Used in /projects/slug")}${field("Category", "category", d.category, "text", "main-work or small-projects")}${field("Description", "description", d.description, "textarea")}${field("Long description", "longDescription", d.longDescription, "textarea")}${field("Thumbnail path", "thumbnail", d.thumbnail)}${field("Technologies (comma-separated)", "_technologies", (d.technologies || []).join(", "))}${field("GitHub URL", "githubUrl", d.githubUrl)}${field("Demo URL", "demoUrl", d.demoUrl)}${field("Featured", "featured", d.featured, "checkbox")}`;
  }
  if (doc.id === "site-settings") {
    return `<h2>Site settings</h2><p class="hint">${escapeHtml(d.cmsNotice || "")}</p>
      ${field("Site name", "siteName", d.siteName)}${field("Footer blurb", "footer.blurb", d.footer?.blurb, "textarea")}${field("Default SEO title", "seo.defaultTitle", d.seo?.defaultTitle)}${field("Default SEO description", "seo.defaultDescription", d.seo?.defaultDescription, "textarea")}`;
  }
  if (doc.id === "contact") {
    return `<h2>Contact</h2>${field("Status", "status", d.status, "select-status")}${field("Title", "title", d.title)}${field("Subtitle", "subtitle", d.subtitle)}${field("Lead", "lead", d.lead, "textarea")}`;
  }
  return `<h2>${escapeHtml(doc.id)}</h2><p>Edit status below or adjust the raw JSON directly.</p>
    ${field("Status", "status", d.status, "select-status")}<div class="bo-field"><label>Raw JSON</label><textarea id="raw-json" style="min-height:320px;font-family:monospace">${escapeHtml(JSON.stringify(d, null, 2))}</textarea></div>`;
}

function renderEditor() {
  if (state.loading) {
    el.editor.innerHTML = `<div class="bo-empty">Loading content…</div>`;
    return;
  }
  if (state.section === "media") {
    el.breadcrumb.textContent = "Media / Portfolio";
    el.statusPill.textContent = "";
    el.editor.innerHTML = `<form class="bo-editor" id="bo-form">${renderEditorForm(null)}</form>`;
    wireMediaUpload();
    return;
  }
  const doc = getSelectedDoc();
  if (!doc) {
    el.editor.innerHTML = `<div class="bo-empty">Select a content node from the tree.</div>`;
    return;
  }
  el.breadcrumb.textContent = `Content / ${doc.id}`;
  updateStatusPill(doc.data.status);
  el.editor.innerHTML = `<form class="bo-editor" id="bo-form">${renderEditorForm(doc)}</form>`;
  const form = document.getElementById("bo-form");
  bindEditor(form, doc);
  const raw = document.getElementById("raw-json");
  if (raw) {
    raw.addEventListener("change", () => {
      try {
        doc.data = JSON.parse(raw.value);
        state.dirty = true;
      } catch {
        toast("Invalid JSON", false);
      }
    });
  }
  form.querySelector("[data-key=_technologies]")?.addEventListener("input", (e) => {
    doc.data.technologies = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
    state.dirty = true;
  });
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
  el.btnSave.disabled = !state.dirty || !state.github?.isAuthenticated();
  el.btnPublish.disabled = !state.github?.isAuthenticated() || !getSelectedDoc();
  el.btnDelete.style.display = getSelectedDoc()?.kind === "project" ? "" : "none";
}

function wireRail() {
  document.querySelectorAll("[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.section = btn.dataset.section;
      if (state.section === "settings") state.selected = "site-settings";
      if (state.section === "media") state.selected = null;
      document.querySelectorAll("[data-section]").forEach((b) => b.classList.toggle("active", b === btn));
      render();
    });
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
    state.dirty = false;
    toast("Saved to GitHub. Site will update after GitHub Pages deploys.");
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

async function deleteSelectedProject() {
  const doc = getSelectedDoc();
  if (!doc || doc.kind !== "project") return;
  if (!confirm(`Delete project “${doc.data.title}”? This removes JSON and the project page from the repo.`)) return;
  if (!state.github?.isAuthenticated()) {
    toast("Sign in with GitHub to delete.", false);
    return;
  }
  try {
    await state.github.deleteFile(doc.repoPath, `CMS: delete project ${doc.slug}`);
    try {
      await state.github.deleteFile(`projects/${doc.slug}/index.html`, `CMS: delete project page ${doc.slug}`);
    } catch {
      /* page may not exist yet */
    }
    const index = state.docs.get("projects-index");
    index.data.slugs = (index.data.slugs || []).filter((s) => s !== doc.slug);
    await commitDoc(index, `CMS: remove slug ${doc.slug}`);
    toast("Project deleted.");
    state.selected = "projects-index";
    state.dirty = false;
    await loadContent();
  } catch (e) {
    toast(e.message, false);
  }
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
  render();
  toast("Project created locally. Save to commit to GitHub.");
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
  el.app.hidden = false;
  updateAuthUi();
}

async function main() {
  await ensureCmsAccess();
  const cfg = await loadCmsConfig();
  const gateOn =
    cfg?.cmsAccess?.passwordSha256 &&
    !String(cfg.cmsAccess.passwordSha256).includes("YOUR_");
  if (!gateOn && el.btnCmsLock) el.btnCmsLock.style.display = "none";
  wireRail();
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
  el.btnDelete.addEventListener("click", deleteSelectedProject);
  el.btnNewProject.addEventListener("click", createProject);
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
}

main().catch((err) => {
  console.error("CMS failed to start:", err);
  const box = document.getElementById("bo-editor");
  if (box) {
    box.innerHTML = `<div class="bo-empty"><p><strong>CMS failed to load.</strong></p><p>${err.message}</p><p>Hard-refresh (Ctrl+F5) or check the browser console.</p></div>`;
  }
  toast(err.message, false);
});
