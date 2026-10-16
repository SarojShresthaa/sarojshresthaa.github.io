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

function buildPersonNode(settings, origin) {
  const o = origin || siteOrigin(settings);
  const sameAs = (settings.social || []).map((s) => s.url).filter(Boolean);
  const img = absoluteUrl(o, settings.seo?.personImage || "/img/saroj.png");
  return {
    "@type": "Person",
    "@id": o + "/#person",
    name: "Saroj Shrestha",
    givenName: "Saroj",
    familyName: "Shrestha",
    url: o + "/",
    jobTitle: "Umbraco & .NET Developer",
    description: settings.seo?.defaultDescription || settings.tagline || "",
    knowsAbout: [
      "Umbraco CMS",
      "ASP.NET Core",
      "C#",
      "Web development",
      "Content management systems",
    ],
    worksFor: {
      "@type": "Organization",
      name: "ZAAKS!",
    },
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
  };
}

function buildHomeFaqNode(settings, origin) {
  const o = origin || siteOrigin(settings);
  const desc =
    settings.seo?.defaultDescription ||
    "Saroj Shrestha is an Umbraco and .NET developer at ZAAKS! in Kathmandu.";
  return {
    "@type": "FAQPage",
    "@id": o + "/#faq",
    mainEntity: [
      {
        "@type": "Question",
        name: "Who is Saroj Shrestha?",
        acceptedAnswer: {
          "@type": "Answer",
          text: desc,
        },
      },
      {
        "@type": "Question",
        name: "What does Saroj Shrestha do?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Saroj Shrestha builds Umbraco and .NET websites and backoffices, maintains open-source Umbraco packages, and works with editors on Block Lists and document types.",
        },
      },
      {
        "@type": "Question",
        name: "How can I contact Saroj Shrestha?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Reach Saroj Shrestha on GitHub at github.com/SarojShresthaa or on LinkedIn. His site is saroj.dev.",
        },
      },
    ],
  };
}

function buildWebsitePersonGraph(settings) {
  const origin = siteOrigin(settings);
  const img = absoluteUrl(origin, settings.seo?.personImage || "/img/saroj.png");
  const person = buildPersonNode(settings, origin);
  const pageDesc = settings.seo?.defaultDescription || "";
  const pageTitle = settings.seo?.defaultTitle || "Saroj Shrestha";
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
        ],
        description: pageDesc || settings.tagline || "",
        inLanguage: "en",
        publisher: { "@id": origin + "/#person" },
      },
      {
        "@type": "ProfilePage",
        "@id": origin + "/#webpage",
        url: origin + "/",
        name: pageTitle,
        description: pageDesc,
        isPartOf: { "@id": origin + "/#website" },
        about: { "@id": origin + "/#person" },
        mainEntity: { "@id": origin + "/#person" },
        primaryImageOfPage: { "@type": "ImageObject", url: img },
        inLanguage: "en",
      },
      person,
      buildHomeFaqNode(settings, origin),
    ],
  };
}

module.exports = {
  readSiteSettings,
  buildWebsitePersonGraph,
  buildPersonNode,
  buildHomeFaqNode,
  siteOrigin,
  absoluteUrl,
};
