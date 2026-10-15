/**
 * Adds static SEO fallbacks + seo.js to public HTML pages.
 * Run: node scripts/inject-html-seo.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ORIGIN = "https://saroj.dev";
const DEFAULT_IMAGE = ORIGIN + "/img/saroj.png";

const PAGES = {
  "index.html": {
    path: "/",
    title: "Saroj Shrestha – Umbraco & .NET Developer",
    description: "Saroj Shrestha, Umbraco and .NET developer at ZAAKS! in Kathmandu.",
  },
  "projects.html": {
    path: "/projects",
    title: "Projects – Saroj Shrestha",
    description: "Real Umbraco, .NET, and community work from Usome, ZAAKS!, and GitHub.",
  },
  "about.html": {
    path: "/about",
    title: "About – Saroj Shrestha",
    description: "About Saroj Shrestha — Umbraco and .NET developer in Kathmandu.",
  },
  "about-me.html": {
    path: "/about",
    title: "About – Saroj Shrestha",
    description: "About Saroj Shrestha — Umbraco and .NET developer in Kathmandu.",
    noindex: true,
  },
  "contact.html": {
    path: "/contact",
    title: "Contact – Saroj Shrestha",
    description: "Contact Saroj Shrestha on GitHub or LinkedIn.",
  },
  "experience.html": {
    path: "/experience",
    title: "Experience – Saroj Shrestha",
    description: "Umbraco & .NET roles and experience.",
  },
  "education.html": {
    path: "/education",
    title: "Education – Saroj Shrestha",
    description: "Education background.",
  },
  "skills.html": {
    path: "/skills",
    title: "Skills – Saroj Shrestha",
    description: "Technologies and focus areas — Umbraco, .NET, and backoffice development.",
  },
  "certifications.html": {
    path: "/certifications",
    title: "Certifications – Saroj Shrestha",
    description: "Professional certifications.",
  },
  "services.html": {
    path: "/services",
    title: "Services – Saroj Shrestha",
    description: "Development services.",
  },
};

function escAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function metaBlock(meta) {
  const url = ORIGIN + (meta.path === "/" ? "/" : meta.path);
  const robots = meta.noindex ? "noindex, follow" : "index, follow, max-image-preview:large";
  return `  <meta name="author" content="Saroj Shrestha" />
  <meta name="robots" content="${robots}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:site_name" content="saroj.dev" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escAttr(meta.title)}" />
  <meta property="og:description" content="${escAttr(meta.description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${DEFAULT_IMAGE}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(meta.title)}" />
  <meta name="twitter:description" content="${escAttr(meta.description)}" />
  <meta name="twitter:image" content="${DEFAULT_IMAGE}" />`;
}

function stripOldSeo(html) {
  return html
    .replace(/  <meta name="author"[^>]*>\n?/g, "")
    .replace(/  <meta name="robots"[^>]*>\n?/g, "")
    .replace(/  <link rel="canonical"[^>]*>\n?/g, "")
    .replace(/  <meta property="og:[^"]+"[^>]*>\n?/g, "")
    .replace(/  <meta name="twitter:[^"]+"[^>]*>\n?/g, "");
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
    html = html.replace(/<title>([^<]*)<\/title>/, (m, t) => {
      const title = meta.title || t;
      return `<title>${title}</title>\n  <meta name="description" content="${escAttr(meta.description)}" />\n${block}`;
    });
  }

  if (!html.includes("/js/seo.js")) {
    html = html.replace(
      "<script src=\"/js/portfolio.js\"></script>",
      "<script src=\"/js/seo.js\"></script>\n  <script src=\"/js/portfolio.js\"></script>"
    );
  }

  fs.writeFileSync(file, html);
  console.log("Patched", rel);
}

Object.keys(PAGES).forEach((rel) => patchFile(rel, PAGES[rel]));

const projectsDir = path.join(ROOT, "projects");
for (const slug of fs.readdirSync(projectsDir)) {
  const rel = `projects/${slug}/index.html`;
  patchFile(rel, {
    path: `/projects/${slug}`,
    title: "Project – Saroj Shrestha",
    description: "Umbraco and .NET project by Saroj Shrestha.",
  });
}

console.log("Done.");
