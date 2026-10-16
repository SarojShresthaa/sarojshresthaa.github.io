/**
 * Static HTML export: reads content/*.json and writes clean-html/ (no CMS, no portfolio.js).
 * Run: node scripts/build-clean-html.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "clean-html");
const CONTENT = path.join(ROOT, "content");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, rel), "utf8"));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @param {'' | 'projects'} pageDir */
function assetUrl(pageDir, sitePath) {
  const prefix = pageDir ? "../" : "";
  if (!sitePath) return "";
  if (sitePath.startsWith("http")) return sitePath;
  const p = sitePath.startsWith("/") ? sitePath.slice(1) : sitePath;
  return prefix + p;
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(from, to);
    else fs.copyFileSync(from, to);
  }
}

function copyStaticAssets() {
  copyDirRecursive(path.join(ROOT, "css"), path.join(OUT, "css"));
  copyDirRecursive(path.join(ROOT, "img"), path.join(OUT, "img"));
  fs.mkdirSync(path.join(OUT, "js"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "js", "main.js"), path.join(OUT, "js", "main.js"));
}

/** @param {'' | 'projects'} pageDir */
function pageHref(pageDir, href) {
  if (!href || href.startsWith("http")) return href || "#";
  const h = href.replace(/\/$/, "") || "/";
  const toProjects = (slug) =>
    pageDir === "projects" ? `${slug}.html` : `projects/${slug}.html`;
  const up = pageDir ? "../" : "";
  if (h === "/") return `${up}index.html`;
  if (h === "/projects") return `${up}projects.html`;
  if (h === "/about") return `${up}about.html`;
  if (h === "/contact") return `${up}contact.html`;
  if (h === "/experience") return `${up}experience.html`;
  if (h.startsWith("/projects/")) return toProjects(h.slice("/projects/".length));
  return href;
}

function renderProjectCard(project, pageDir, options) {
  const detailHref = pageHref(pageDir, "/projects/" + project.slug);
  const thumb = project.thumbnail
    ? `<div class="thumb"><img src="${assetUrl(pageDir, project.thumbnail)}" alt="${escapeHtml(project.thumbnailAlt || project.title)}" /></div>`
    : "";
  const toolsClass = project.thumbnail ? "tools" : "tools no-top";
  const tech = (project.technologies || [])
    .map((t) => `<li>${escapeHtml(t)}</li>`)
    .join("");
  const buttons = [];
  buttons.push(`<a class="gray-btn" href="${detailHref}">Details</a>`);
  if (project.githubUrl) {
    buttons.push(
      `<a class="${options?.primary ? "primary-btn" : "gray-btn"}" href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noreferrer">GitHub</a>`
    );
  }
  if (project.demoUrl) {
    buttons.push(
      `<a class="gray-btn" href="${escapeHtml(project.demoUrl)}" target="_blank" rel="noreferrer">Live demo</a>`
    );
  }
  return `<article class="project-card">
      ${thumb}
      <ul class="${toolsClass}">${tech}</ul>
      <div class="body">
        <h3><a href="${detailHref}">${escapeHtml(project.title)}</a></h3>
        <p>${escapeHtml(project.description)}</p>
        <div class="btns">${buttons.join("")}</div>
      </div>
    </article>`;
}

function renderSkillsLayout(skills, pageDir) {
  const cols = skills.columns || [];
  const chunk = (arr, n) => {
    const out = [];
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
  };
  const grouped = chunk(cols, 2);
  return `<div class="skills-layout">
      <div class="skills-art">
        <div class="skills-art-copy">
          <p class="skills-art-kicker">${escapeHtml(skills.kicker)}</p>
          <p class="skills-art-text">${escapeHtml(skills.intro)}</p>
        </div>
        <img class="logo-a" src="${assetUrl(pageDir, "/img/logo-outline.svg")}" alt="" decoding="async" loading="lazy" />
      </div>
      <div class="skills-cols">
        ${grouped
          .map(
            (group) => `<div class="skills-col">${group
              .map(
                (col) => `<div class="card"><h4>${escapeHtml(col.title)}</h4><ul>${col.items
                  .map((i) => `<li>${escapeHtml(i)}</li>`)
                  .join("")}</ul></div>`
              )
              .join("")}</div>`
          )
          .join("")}
      </div>
    </div>`;
}

function navHtml(settings, pageDir, activePath) {
  const normalized = activePath === "/about-me" ? "/about" : activePath;
  const items = (settings.navigation || [])
    .map((item) => {
      const active = normalized === item.href ? " active" : "";
      return `<li><a class="nav-link${active}" href="${pageHref(pageDir, item.href)}">${escapeHtml(item.label)}</a></li>`;
    })
    .join("\n          ");
  const social = (settings.social || [])
    .map(
      (s) =>
        `<a class="soc" data-icon="${escapeHtml(s.id)}" href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(s.label)}"></a>`
    )
    .join("");
  const footerSocial = (settings.social || [])
    .map(
      (s) =>
        `<li><a class="soc" data-icon="${escapeHtml(s.id)}" href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(s.label)}"></a></li>`
    )
    .join("");
  return { items, social, footerSocial };
}

function shell({
  pageDir,
  settings,
  activePath,
  title,
  description,
  bodyMain,
  bodyPageAttr,
}) {
  const { items, social, footerSocial } = navHtml(settings, pageDir, activePath);
  const css = assetUrl(pageDir, "/css/style.css");
  const favicon = assetUrl(pageDir, settings.favicon || "/img/favicon.svg");
  const mainJs = assetUrl(pageDir, "/js/main.js");
  const siteName = escapeHtml(settings.siteName || "saroj.dev");
  const blurb = escapeHtml(settings.footer?.blurb || "");
  const copyright = escapeHtml(settings.footer?.copyright || "");
  const logoHref = pageHref(pageDir, "/");
  const fullTitle = escapeHtml(title || settings.seo?.defaultTitle || siteName);
  const desc = escapeHtml(description || settings.seo?.defaultDescription || "");
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${fullTitle}</title>
  <meta name="description" content="${desc}" />
  <meta name="author" content="Saroj Shrestha" />
  <meta name="robots" content="index, follow" />
  <link rel="icon" href="${favicon}" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${css}" />
  <script>
    (function () {
      var saved = localStorage.getItem("theme");
      var theme = saved;
      if (!theme && window.matchMedia) {
        theme = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      }
      document.documentElement.setAttribute("data-theme", theme || "dark");
    })();
  </script>
</head>
<body${bodyPageAttr ? ` data-page="${bodyPageAttr}"` : ""}>
  <header class="header">
    <div class="container header-inner">
      <a class="logo" href="${logoHref}">
        <span class="logo-mark" aria-hidden="true"></span>
        <span>${siteName}</span>
      </a>
      <div class="menu-cont">
        <button class="menu-btn" type="button" aria-label="Open menu">
          <span></span>
          <span></span>
        </button>
        <ul class="menubar">
          ${items}
          <li>
            <button class="soc theme-btn" type="button" aria-label="Toggle light and dark mode">
              <svg class="icon-lamp-off" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 21h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1Zm3-19a7 7 0 0 0-4 12.6V17h8v-2.4A7 7 0 0 0 12 2Z"/>
              </svg>
              <svg class="icon-lamp-on" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 21h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1Zm3-19a7 7 0 0 0-4 12.6V17h8v-2.4A7 7 0 0 0 12 2Z"/>
              </svg>
            </button>
          </li>
          <div class="social-rail animate-bounce-slower"><span class="social-line"></span>${social}</div>
        </ul>
      </div>
    </div>
  </header>

  <main class="container page">
${bodyMain}
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <div class="footer-top">
          <a class="logo" href="${logoHref}">
            <span class="logo-mark" aria-hidden="true"></span>
            <span>${siteName}</span>
          </a>
        </div>
        <p>${blurb}</p>
      </div>
      <div class="footer-media">
        <h3>Media</h3>
        <ul class="media-links">${footerSocial}</ul>
      </div>
    </div>
    <p class="copyright">${copyright}</p>
  </footer>

  <script src="${mainJs}"></script>
</body>
</html>
`;
}

function writeRel(relPath, html) {
  const full = path.join(OUT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html, "utf8");
}

function loadProjects() {
  const index = readJson("projects/index.json");
  const projects = index.slugs
    .map((slug) => {
      const p = readJson("projects/" + slug + ".json");
      p.slug = slug;
      return p;
    })
    .filter((p) => p.status === "published");
  return { index, projects };
}

function buildHome(settings, home, skills, projects) {
  const pageDir = "";
  const featured = home.featuredProjectSlugs
    .map((slug) => projects.find((p) => p.slug === slug))
    .filter(Boolean);
  const statusHtml = escapeHtml(home.hero.statusText).replace(
    /ZAAKS!/g,
    "<strong>ZAAKS!</strong>"
  );
  const aboutParas = home.aboutSnippet.paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/ZAAKS!/g, "<strong>ZAAKS!</strong>")}</p>`)
    .join("\n          ");
  const contactBox =
    `<h4>${escapeHtml(home.contactSection.messageBoxHeading)}</h4>` +
    (settings.social || [])
      .map(
        (s) =>
          `<a class="contact-row" href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer"><span class="soc" data-icon="${escapeHtml(s.id)}" aria-hidden="true"></span> ${escapeHtml(s.display || s.url)}</a>`
      )
      .join("");

  const main = `    <section class="hero">
      <div class="hero-copy">
        <h1>${escapeHtml(home.hero.heading)}<br><span class="accent">${escapeHtml(home.hero.headingAccent)}</span></h1>
        <p class="hero-sub">${escapeHtml(home.hero.subtitle)}</p>
        <a class="primary-btn" href="${pageHref(pageDir, home.hero.cta.href)}">${escapeHtml(home.hero.cta.label)}</a>
      </div>
      <div class="hero-art">
        <div class="hero-frame">
          <img class="logo-outline animate-show-ltr" src="${assetUrl(pageDir, "/img/logo-outline.svg")}" alt="" decoding="async" />
          <img class="hero-photo" src="${assetUrl(pageDir, home.hero.profileImage)}" alt="${escapeHtml(home.hero.profileImageAlt)}" width="457" height="386" fetchpriority="high" decoding="async" />
          <img class="dots animate-show-rtl" src="${assetUrl(pageDir, "/img/dots.svg")}" alt="" decoding="async" />
        </div>
        <p class="status">
          <span class="status-dot" aria-hidden="true"></span>
          <span>${statusHtml}</span>
        </p>
      </div>
    </section>
    <div class="quote-wrap">
      <p class="quote">${escapeHtml(home.quote.text)}</p>
      <span class="quote-author">- ${escapeHtml(home.quote.author)}</span>
      <span class="deco-square sm quote-sq animate-bounce-slow"></span>
    </div>
    <section class="section about-snippet">
      <div class="about-snippet-inner">
        <div class="about-copy">
          <h2 class="section-heading after">${escapeHtml(home.aboutSnippet.heading)}</h2>
          ${aboutParas}
          <a class="primary-btn" href="${pageHref(pageDir, home.aboutSnippet.cta.href)}">${escapeHtml(home.aboutSnippet.cta.label)}</a>
        </div>
        <figure class="about-snippet-art">
          <img src="${assetUrl(pageDir, home.aboutSnippet.image)}" alt="${escapeHtml(home.aboutSnippet.imageAlt)}" width="480" height="360" loading="lazy" />
        </figure>
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <h2 class="section-heading after">${escapeHtml(home.projectsSection.heading)}</h2>
        <a class="view-all" href="${pageHref(pageDir, home.projectsSection.viewAllHref)}">${escapeHtml(home.projectsSection.viewAllLabel)}</a>
      </div>
      <div class="projects-grid">${featured.map((p) => renderProjectCard(p, pageDir, { primary: true })).join("")}</div>
    </section>
    <section class="section">
      <div class="section-head">
        <h2 class="section-heading after">${escapeHtml(home.skillsSection.heading)}</h2>
      </div>
      ${renderSkillsLayout({ ...skills, intro: home.skillsSection.intro || skills.intro, kicker: home.skillsSection.kicker || skills.kicker }, pageDir)}
    </section>
    <section class="section">
      <div class="section-head">
        <h2 class="section-heading after">${escapeHtml(home.contactSection.heading)}</h2>
      </div>
      <div class="contact-grid">
        <p class="lead">${escapeHtml(home.contactSection.lead)}</p>
        <div class="contact-box">${contactBox}</div>
      </div>
    </section>`;

  return shell({
    pageDir,
    settings,
    activePath: "/",
    title: settings.seo?.defaultTitle,
    description: settings.seo?.defaultDescription,
    bodyMain: main,
    bodyPageAttr: "",
  });
}

function buildAbout(settings, about) {
  const pageDir = "";
  const main = `    <div data-about-root>
    <section class="about-hero about-page">
      <p class="about-eyebrow">${escapeHtml(about.eyebrow)}</p>
      <h1 class="about-lead">${escapeHtml(about.heading)}</h1>
      <div class="about-body">${about.biography.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}</div>
    </section>
    <section class="section about-work">
      <p class="about-work-kicker">${escapeHtml(about.workSection.kicker)}</p>
      <h2 class="section-heading">${escapeHtml(about.workSection.heading)}</h2>
      <p class="help-intro">${escapeHtml(about.workSection.intro)}</p>
      <ul class="about-tags">${about.workSection.tags.map((t) => `<li class="about-tag">${escapeHtml(t)}</li>`).join("")}</ul>
    </section>
    <section class="section about-life">
      <p class="about-work-kicker">${escapeHtml(about.lifeSection.kicker)}</p>
      <h2 class="section-heading">${escapeHtml(about.lifeSection.heading)}</h2>
      <p class="help-intro">${escapeHtml(about.lifeSection.intro)}</p>
      <ul class="about-tags">${about.lifeSection.tags.map((t) => `<li class="about-tag">${escapeHtml(t)}</li>`).join("")}</ul>
    </section>
    </div>`;
  return shell({
    pageDir,
    settings,
    activePath: "/about",
    title: about.heading,
    description: about.biography?.[0],
    bodyMain: main,
    bodyPageAttr: "",
  });
}

function buildProjects(settings, index, projects) {
  const pageDir = "";
  const main = `    <div class="page-title">
      <h2>${escapeHtml(index.title)}</h2>
      <p>${escapeHtml(index.subtitle)}</p>
    </div>
    <section class="section">
      <h3 class="section-heading">${escapeHtml(index.mainWorkHeading || "main-work")}</h3>
      <div class="projects-grid">${projects
        .filter((p) => p.category === "main-work")
        .map((p) => renderProjectCard(p, pageDir, { primary: true }))
        .join("")}</div>
    </section>
    <section class="section">
      <h3 class="section-heading">${escapeHtml(index.smallProjectsHeading || "small-projects")}</h3>
      <div class="projects-grid">${projects
        .filter((p) => p.category === "small-projects")
        .map((p) => renderProjectCard(p, pageDir, { primary: false }))
        .join("")}</div>
    </section>`;
  return shell({
    pageDir,
    settings,
    activePath: "/projects",
    title: index.title,
    description: index.subtitle,
    bodyMain: main,
    bodyPageAttr: "",
  });
}

function buildContact(settings, contact) {
  const pageDir = "";
  const box =
    `<h4>${escapeHtml(contact.messageBoxHeading)}</h4>` +
    (settings.social || [])
      .map(
        (s) =>
          `<a class="contact-row" href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer"><span class="soc" data-icon="${escapeHtml(s.id)}" aria-hidden="true"></span> ${escapeHtml(s.display)}</a>`
      )
      .join("");
  const main = `    <div class="page-title">
      <h2>${escapeHtml(contact.title)}</h2>
      <p>${escapeHtml(contact.subtitle)}</p>
    </div>
    <section class="section">
      <p class="lead">${escapeHtml(contact.lead)}</p>
      <div class="contact-box">${box}</div>
    </section>`;
  return shell({
    pageDir,
    settings,
    activePath: "/contact",
    title: contact.title,
    description: contact.lead,
    bodyMain: main,
    bodyPageAttr: "",
  });
}

function buildExperience(settings, data) {
  const pageDir = "";
  const list = (data.items || [])
    .map(
      (item) => `<article class="card" style="margin-bottom:1rem">
          <h3>${escapeHtml(item.role)} · ${escapeHtml(item.organization)}</h3>
          <p><em>${escapeHtml(item.startDate)} – ${escapeHtml(item.endDate)}</em>${item.location ? " · " + escapeHtml(item.location) : ""}</p>
          <p>${escapeHtml(item.description)}</p>
          ${item.achievements?.length ? `<ul>${item.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>` : ""}
        </article>`
    )
    .join("");
  const main = `    <div class="page-title">
      <h2>${escapeHtml(data.title)}</h2>
      <p>${escapeHtml(data.subtitle)}</p>
    </div>
    <section class="section">${list}</section>`;
  return shell({
    pageDir,
    settings,
    activePath: "/experience",
    title: data.title,
    description: data.subtitle,
    bodyMain: main,
    bodyPageAttr: "",
  });
}

function buildProjectDetail(settings, project) {
  const pageDir = "projects";
  const gallery = (project.gallery || [])
    .map(
      (g, i) =>
        `<img src="${assetUrl(pageDir, g)}" alt="${escapeHtml(project.title + " screenshot " + (i + 1))}" loading="lazy" decoding="async" />`
    )
    .join("");
  const main = `    <div class="page-title">
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(project.description)}</p>
      </div>
      <section class="section">
        ${project.thumbnail ? `<div class="thumb" style="max-width:480px;margin-bottom:1.5rem"><img src="${assetUrl(pageDir, project.thumbnail)}" alt="${escapeHtml(project.thumbnailAlt || project.title)}" /></div>` : ""}
        <p class="lead">${escapeHtml(project.longDescription || project.description)}</p>
        <ul class="about-tags">${(project.technologies || []).map((t) => `<li class="about-tag">${escapeHtml(t)}</li>`).join("")}</ul>
        ${gallery ? `<div class="media-list" style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:1rem">${gallery}</div>` : ""}
        <div class="btns" style="margin-top:1.5rem">
          ${project.githubUrl ? `<a class="primary-btn" href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noreferrer">GitHub</a>` : ""}
          ${project.demoUrl ? `<a class="gray-btn" href="${escapeHtml(project.demoUrl)}" target="_blank" rel="noreferrer">Live demo</a>` : ""}
          <a class="gray-btn" href="${pageHref(pageDir, "/projects")}">All projects</a>
        </div>
      </section>`;
  return shell({
    pageDir,
    settings,
    activePath: "/projects/" + project.slug,
    title: project.title,
    description: project.description,
    bodyMain: main,
    bodyPageAttr: "",
  });
}

function main() {
  if (fs.existsSync(OUT)) {
    fs.rmSync(OUT, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT, { recursive: true });

  const settings = readJson("site-settings.json");
  const home = readJson("home.json");
  const skills = readJson("skills.json");
  const about = readJson("about.json");
  const contact = readJson("contact.json");
  const experience = readJson("experience.json");
  const { index, projects } = loadProjects();

  writeRel("index.html", buildHome(settings, home, skills, projects));
  writeRel("about.html", buildAbout(settings, about));
  writeRel("projects.html", buildProjects(settings, index, projects));
  writeRel("contact.html", buildContact(settings, contact));
  writeRel("experience.html", buildExperience(settings, experience));

  for (const project of projects) {
    writeRel("projects/" + project.slug + ".html", buildProjectDetail(settings, project));
  }

  copyStaticAssets();

  fs.writeFileSync(
    path.join(OUT, "README.txt"),
    `Self-contained static HTML snapshot (generated).

Preview (from this folder):
  cd clean-html
  npx --yes serve .
  Open http://localhost:3000/

Or zip clean-html/ and host anywhere — no CMS, no JSON, no parent repo needed.
Google Fonts still load from the CDN.

Regenerate after CMS/content changes (from repo root):
  node scripts/build-clean-html.js
`,
    "utf8"
  );

  console.log(
    "Wrote self-contained clean-html/ —",
    5 + projects.length,
    "HTML pages + css/, img/, js/main.js"
  );
}

main();
