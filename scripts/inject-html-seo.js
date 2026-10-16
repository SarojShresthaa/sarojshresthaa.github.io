/**
 * Adds static SEO fallbacks + seo.js to public HTML pages.
 * Run: node scripts/inject-html-seo.js
 */
const fs = require("fs");
const path = require("path");
const {
  readSiteSettings,
  buildWebsitePersonGraph,
  geoMetaTags,
  siteOrigin,
  absoluteUrl,
} = require("./seo-person-graph");
const SEOPageMeta = require("../js/seo-page-meta");

const ROOT = path.join(__dirname, "..");
const settings = readSiteSettings(ROOT);
const ORIGIN = siteOrigin(settings);
const DEFAULT_IMAGE = absoluteUrl(ORIGIN, settings.seo?.personImage || "/img/saroj.png");
const OG_IMAGE_ALT = settings.seo?.ogImageAlt || "Saroj Shrestha";
const OG_SITE_NAME = settings.seo?.structuredSiteName || "Saroj Shrestha";

const FAVICON_BLOCK = `  <link rel="icon" href="/favicon.ico" sizes="48x48" />
  <link rel="icon" type="image/png" sizes="48x48" href="/img/favicon-48.png" />
  <link rel="icon" href="/img/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/img/favicon-48.png" />`;

const HOME_TITLE =
  settings.seo?.defaultTitle || "Saroj Shrestha – Umbraco & .NET Developer";
const HOME_DESC =
  settings.seo?.defaultDescription ||
  "Saroj Shrestha — Umbraco and .NET developer in Kathmandu, Nepal. Works at ZAAKS!; explore projects, experience, and skills, or connect on GitHub and LinkedIn.";

function buildPagesMap() {
  const map = {
    "index.html": {
      path: "/",
      title: HOME_TITLE,
      description: HOME_DESC,
      homeGraph: true,
    },
  };
  for (const [file, key] of Object.entries({
    "projects.html": "projects",
    "about.html": "about",
    "about-me.html": "about",
    "contact.html": "contact",
    "experience.html": "experience",
    "education.html": "education",
    "skills.html": "skills",
    "certifications.html": "certifications",
    "services.html": "services",
  })) {
    const meta = { ...SEOPageMeta.pages[key] };
    if (file === "about-me.html") meta.noindex = true;
    map[file] = meta;
  }
  return map;
}

const PAGES = buildPagesMap();

function escAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function relMeLinks() {
  return (settings.social || [])
    .filter((s) => s.url)
    .map((s) => `  <link rel="me" href="${escAttr(s.url)}" />`)
    .join("\n");
}

function metaBlock(meta) {
  const url = ORIGIN + (meta.path === "/" ? "/" : meta.path);
  const robots = meta.noindex ? "noindex, follow" : "index, follow, max-image-preview:large";
  let extra = "";
  if (meta.homeGraph) {
    const graph = JSON.stringify(buildWebsitePersonGraph(settings));
    extra = `\n${relMeLinks()}\n  <script type="application/ld+json" id="portfolio-jsonld">${graph}</script>`;
  }
  return `  <meta name="author" content="Saroj Shrestha" />
${geoMetaTags(settings)}
  <meta name="robots" content="${robots}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:site_name" content="${escAttr(OG_SITE_NAME)}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escAttr(meta.title)}" />
  <meta property="og:description" content="${escAttr(meta.description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${DEFAULT_IMAGE}" />
  <meta property="og:image:alt" content="${escAttr(OG_IMAGE_ALT)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(meta.title)}" />
  <meta name="twitter:description" content="${escAttr(meta.description)}" />
  <meta name="twitter:image" content="${DEFAULT_IMAGE}" />${extra}`;
}

function stripOldSeo(html) {
  return html
    .replace(/  <meta name="author"[^>]*>\n?/g, "")
    .replace(/  <meta name="geo\.[^"]+"[^>]*>\n?/g, "")
    .replace(/  <meta name="ICBM"[^>]*>\n?/g, "")
    .replace(/  <meta name="robots"[^>]*>\n?/g, "")
    .replace(/  <link rel="canonical"[^>]*>\n?/g, "")
    .replace(/  <link rel="me"[^>]*>\n?/g, "")
    .replace(/  <script type="application\/ld\+json" id="portfolio-jsonld"[^>]*>[\s\S]*?<\/script>\n?/g, "")
    .replace(/  <meta property="og:[^"]+"[^>]*>\n?/g, "")
    .replace(/  <meta name="twitter:[^"]+"[^>]*>\n?/g, "");
}

function ensureSeoScripts(html) {
  if (!html.includes("/js/seo-page-meta.js")) {
    html = html.replace(
      "<script src=\"/js/portfolio.js\"></script>",
      "<script src=\"/js/seo-page-meta.js\"></script>\n  <script src=\"/js/seo.js\"></script>\n  <script src=\"/js/portfolio.js\"></script>"
    );
  } else if (!html.includes("/js/seo.js")) {
    html = html.replace(
      "<script src=\"/js/portfolio.js\"></script>",
      "<script src=\"/js/seo.js\"></script>\n  <script src=\"/js/portfolio.js\"></script>"
    );
  }
  return html;
}

function patchFile(rel, meta) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes("portfolio.js")) return;

  html = stripOldSeo(html);
  const block = metaBlock(meta);

  if (html.includes('name="description"')) {
    html = html.replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escAttr(meta.description)}" />\n${block}`
    );
  } else {
    html = html.replace(/<title>([^<]*)<\/title>/, () => {
      return `<title>${escAttr(meta.title)}</title>\n  <meta name="description" content="${escAttr(meta.description)}" />\n${block}`;
    });
  }

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escAttr(meta.title)}</title>`);

  html = ensureSeoScripts(html);

  html = html.replace(/  <link rel="icon"[^>]*>\n?/g, "");
  html = html.replace(/  <link rel="apple-touch-icon"[^>]*>\n?/g, "");
  html = html.replace(
    /<link rel="stylesheet" href="\/css\/style.css" \/>/,
    `${FAVICON_BLOCK}\n  <link rel="stylesheet" href="/css/style.css" />`
  );

  fs.writeFileSync(file, html);
  console.log("Patched", rel);
}

Object.keys(PAGES).forEach((rel) => patchFile(rel, PAGES[rel]));

const projectsDir = path.join(ROOT, "projects");
for (const slug of fs.readdirSync(projectsDir)) {
  if (!fs.statSync(path.join(projectsDir, slug)).isDirectory()) continue;
  const rel = `projects/${slug}/index.html`;
  let project = {};
  try {
    project = JSON.parse(
      fs.readFileSync(path.join(ROOT, "content", "projects", `${slug}.json`), "utf8")
    );
  } catch {
    /* use fallbacks in projectMeta */
  }
  patchFile(rel, SEOPageMeta.projectMeta(project, slug));
}

console.log("Done.");
