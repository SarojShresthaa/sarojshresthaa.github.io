/**
 * Person + WebSite JSON-LD (Node) — keep in sync with js/seo.js buildWebsitePersonGraph.
 */
function readSiteSettings(root) {
  const fs = require("fs");
  const path = require("path");
  return JSON.parse(
    fs.readFileSync(path.join(root, "content", "site-settings.json"), "utf8")
  );
}

function siteOrigin(settings) {
  return (settings.seo?.siteUrl || "https://saroj.dev").replace(/\/$/, "");
}

function absoluteUrl(origin, pathOrUrl) {
  if (!pathOrUrl) return origin + "/img/saroj.png";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const p = pathOrUrl.startsWith("/") ? pathOrUrl : "/" + pathOrUrl;
  return origin + p;
}

function buildWebsitePersonGraph(settings) {
  const origin = siteOrigin(settings);
  const img = absoluteUrl(origin, settings.seo?.personImage || "/img/saroj.png");
  const sameAs = (settings.social || []).map((s) => s.url).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": origin + "/#website",
        url: origin + "/",
        name: settings.seo?.structuredSiteName || "Saroj Shrestha",
        alternateName: settings.seo?.structuredSiteAlternateNames || [
          settings.siteName || "saroj.dev",
          "Saroj Shrestha Portfolio",
        ],
        description: settings.seo?.defaultDescription || settings.tagline || "",
        inLanguage: "en",
        publisher: { "@id": origin + "/#person" },
      },
      {
        "@type": "WebPage",
        "@id": origin + "/#webpage",
        url: origin + "/",
        name: settings.seo?.defaultTitle || "Saroj Shrestha",
        description: settings.seo?.defaultDescription || "",
        isPartOf: { "@id": origin + "/#website" },
        about: { "@id": origin + "/#person" },
        primaryImageOfPage: { "@type": "ImageObject", url: img },
      },
      {
        "@type": "Person",
        "@id": origin + "/#person",
        name: "Saroj Shrestha",
        givenName: "Saroj",
        familyName: "Shrestha",
        url: origin + "/",
        jobTitle: "Umbraco & .NET Developer",
        description: settings.seo?.defaultDescription || settings.tagline || "",
        worksFor: { "@type": "Organization", name: "ZAAKS!" },
        homeLocation: {
          "@type": "Place",
          name: "Kathmandu",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Kathmandu",
            addressCountry: "NP",
          },
        },
        sameAs,
        image: {
          "@type": "ImageObject",
          url: img,
          contentUrl: img,
          caption: "Saroj Shrestha",
        },
      },
    ],
  };
}

module.exports = { readSiteSettings, buildWebsitePersonGraph, siteOrigin, absoluteUrl };
