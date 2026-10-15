/**
 * Generates robots.txt and sitemap.xml from content JSON.
 * Run: node scripts/generate-sitemap.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ORIGIN = "https://saroj.dev";

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function urlEntry(loc, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${isoDate()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const staticPages = [
  { path: "/", priority: "1.0" },
  { path: "/projects", priority: "0.9" },
  { path: "/about", priority: "0.8" },
  { path: "/contact", priority: "0.7" },
  { path: "/experience", priority: "0.7" },
  { path: "/education", priority: "0.6" },
  { path: "/skills", priority: "0.6" },
  { path: "/certifications", priority: "0.6" },
  { path: "/services", priority: "0.6" },
];

const projectsIndex = readJson("content/projects/index.json");
const pagesIndex = readJson("content/pages/index.json");

const urls = [...staticPages.map((p) => urlEntry(ORIGIN + p.path, p.priority))];

for (const slug of projectsIndex.slugs || []) {
  try {
    const project = readJson(`content/projects/${slug}.json`);
    if (project.status !== "published") continue;
    urls.push(urlEntry(`${ORIGIN}/projects/${slug}`, "0.8"));
  } catch {
    /* skip missing */
  }
}

for (const slug of pagesIndex.slugs || []) {
  try {
    const page = readJson(`content/pages/${slug}.json`);
    if (page.status !== "published") continue;
    urls.push(urlEntry(`${ORIGIN}/${slug}`, "0.7"));
  } catch {
    /* skip */
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

const robots = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

Disallow: /cms/
Disallow: /admin/
Disallow: /oauth-proxy/
Disallow: /portfolio/
Disallow: /old desgin/

Sitemap: ${ORIGIN}/sitemap.xml
`;

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(ROOT, "robots.txt"), robots);
console.log("Wrote sitemap.xml (" + urls.length + " URLs) and robots.txt");
