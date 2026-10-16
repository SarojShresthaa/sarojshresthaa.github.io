/**
 * Shared page titles and meta descriptions (static HTML + runtime SEO).
 * No "portfolio" wording — name + Umbraco/.NET focus for search.
 */
(function (factory) {
  const meta = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = meta;
  }
  if (typeof window !== "undefined") {
    window.SEOPageMeta = meta;
  }
})(function () {
  const BRAND = "Saroj Shrestha";

  function pageTitle(label) {
    return `${label} | ${BRAND}`;
  }

  function trimMeta(text, max) {
    const limit = max || 160;
    if (!text) return "";
    let s = String(text).replace(/\s+/g, " ").trim();
    if (s.length <= limit) return s;
    s = s.slice(0, limit - 1);
    const cut = s.lastIndexOf(" ");
    if (cut > limit * 0.6) s = s.slice(0, cut);
    return s + "…";
  }

  const pages = {
    projects: {
      path: "/projects",
      title: pageTitle("Projects"),
      description:
        "Umbraco packages, .NET apps, and open-source repos by Saroj Shrestha — work from ZAAKS! in Kathmandu and github.com/SarojShresthaa.",
    },
    about: {
      path: "/about",
      title: pageTitle("About"),
      description:
        "About Saroj Shrestha — Umbraco and .NET developer at ZAAKS! in Kathmandu. Editor-friendly backoffices, Block Lists, and open-source packages on GitHub.",
    },
    contact: {
      path: "/contact",
      title: pageTitle("Contact"),
      description:
        "Contact Saroj Shrestha in Kathmandu, Nepal for Umbraco or .NET work — message on LinkedIn or GitHub (github.com/SarojShresthaa).",
    },
    experience: {
      path: "/experience",
      title: pageTitle("Experience"),
      description:
        "Work experience of Saroj Shrestha — Umbraco CMS and .NET development at ZAAKS! in Kathmandu and related professional roles.",
    },
    education: {
      path: "/education",
      title: pageTitle("Education"),
      description:
        "Education and training of Saroj Shrestha — formal learning alongside Umbraco and .NET development in Nepal.",
    },
    skills: {
      path: "/skills",
      title: pageTitle("Skills"),
      description:
        "Skills of Saroj Shrestha — Umbraco CMS, C#, ASP.NET Core, Razor, Block Lists, Azure, and maintainable backoffices. Based in Kathmandu, Nepal.",
    },
    certifications: {
      path: "/certifications",
      title: pageTitle("Certifications"),
      description:
        "Certifications and courses completed by Saroj Shrestha — credentials that support Umbraco and .NET development.",
    },
    services: {
      path: "/services",
      title: pageTitle("Services"),
      description:
        "Development services from Saroj Shrestha — Umbraco sites, .NET integrations, and backoffices that editors can use with confidence.",
    },
  };

  function htmlFileToPageKey(file) {
    const map = {
      "projects.html": "projects",
      "about.html": "about",
      "about-me.html": "about",
      "contact.html": "contact",
      "experience.html": "experience",
      "education.html": "education",
      "skills.html": "skills",
      "certifications.html": "certifications",
      "services.html": "services",
    };
    return map[file] || null;
  }

  function projectMeta(project, slug) {
    const name = (project && project.title) || slug;
    const title = pageTitle(name);
    let raw = (project && (project.description || project.longDescription)) || "";
    raw = raw.replace(/\bportfolio\b/gi, "open-source").replace(/\s+/g, " ").trim();
    let description;
    if (raw) {
      description = raw.includes(BRAND) ? raw : `${raw} — ${BRAND}.`;
    } else {
      description = `${name} — Umbraco and .NET work by ${BRAND} on saroj.dev.`;
    }
    return {
      path: `/projects/${slug}`,
      title,
      description: trimMeta(description),
    };
  }

  return {
    BRAND,
    pageTitle,
    trimMeta,
    pages,
    htmlFileToPageKey,
    projectMeta,
  };
});
