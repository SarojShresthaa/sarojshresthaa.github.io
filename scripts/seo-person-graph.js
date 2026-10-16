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

function geoFromSettings(settings) {
  const g = settings?.seo?.geo || {};
  return {
    locality: g.locality || "Kathmandu",
    region: g.region || "Bagmati Province",
    country: g.country || "Nepal",
    countryCode: g.countryCode || "NP",
    icbmRegion: g.icbmRegion || "NP-BA",
    latitude: typeof g.latitude === "number" ? g.latitude : 27.7172,
    longitude: typeof g.longitude === "number" ? g.longitude : 85.324,
  };
}

function buildPlaceNode(geo) {
  return {
    "@type": "Place",
    name: `${geo.locality}, ${geo.country}`,
    geo: {
      "@type": "GeoCoordinates",
      latitude: geo.latitude,
      longitude: geo.longitude,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: geo.locality,
      addressRegion: geo.region,
      addressCountry: geo.countryCode,
    },
  };
}

function buildPersonNode(settings, origin) {
  const o = origin || siteOrigin(settings);
  const geo = geoFromSettings(settings);
  const sameAs = (settings.social || []).map((s) => s.url).filter(Boolean);
  const img = absoluteUrl(o, settings.seo?.personImage || "/img/saroj.png");
  const place = buildPlaceNode(geo);
  return {
    "@type": "Person",
    "@id": o + "/#person",
    name: "Saroj Shrestha",
    givenName: "Saroj",
    familyName: "Shrestha",
    url: o + "/",
    jobTitle: "Umbraco & .NET Developer",
    description: settings.seo?.defaultDescription || settings.tagline || "",
    nationality: {
      "@type": "Country",
      name: geo.country,
    },
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
      location: place,
    },
    workLocation: place,
    homeLocation: place,
    sameAs,
    image: {
      "@type": "ImageObject",
      url: img,
      contentUrl: img,
      caption: "Saroj Shrestha",
    },
  };
}

function buildWebsitePersonGraph(settings) {
  const origin = siteOrigin(settings);
  const img = absoluteUrl(origin, settings.seo?.personImage || "/img/saroj.png");
  const person = buildPersonNode(settings, origin);
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
        description: settings.seo?.defaultDescription || settings.tagline || "",
        inLanguage: "en-NP",
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
      person,
    ],
  };
}

function geoMetaTags(settings) {
  const geo = geoFromSettings(settings);
  const placename = `${geo.locality}, ${geo.country}`;
  return [
    `  <meta name="geo.region" content="${geo.icbmRegion}" />`,
    `  <meta name="geo.placename" content="${placename}" />`,
    `  <meta name="geo.position" content="${geo.latitude};${geo.longitude}" />`,
    `  <meta name="ICBM" content="${geo.latitude}, ${geo.longitude}" />`,
  ].join("\n");
}

module.exports = {
  readSiteSettings,
  buildWebsitePersonGraph,
  buildPersonNode,
  geoFromSettings,
  geoMetaTags,
  siteOrigin,
  absoluteUrl,
};
