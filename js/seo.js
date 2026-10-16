/**
 * Shared SEO helpers for the static portfolio (GitHub Pages).
 * Domain must match CNAME / site-settings seo.siteUrl.
 */
(function (global) {
  const DEFAULT_ORIGIN = "https://saroj.dev";

  function siteOrigin(settings) {
    const fromSettings = settings?.seo?.siteUrl?.trim();
    if (fromSettings) return fromSettings.replace(/\/$/, "");
    return DEFAULT_ORIGIN;
  }

  function normalizePath(path) {
    if (!path || path === "/") return "/";
    let p = path.split("?")[0].split("#")[0];
    if (!p.startsWith("/")) p = "/" + p;
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p;
  }

  function absoluteUrl(origin, pathOrUrl) {
    if (!pathOrUrl) return origin + "/img/saroj.png";
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const p = pathOrUrl.startsWith("/") ? pathOrUrl : "/" + pathOrUrl;
    return origin + p;
  }

  function upsertMeta(attr, key, content) {
    if (content == null || content === "") return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function upsertLink(rel, href, extra) {
    if (!href) return;
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
    if (extra) {
      Object.keys(extra).forEach((k) => {
        if (extra[k] != null) el.setAttribute(k, extra[k]);
      });
    }
  }

  function setJsonLd(data) {
    const id = "portfolio-jsonld";
    let script = document.getElementById(id);
    if (!data) {
      script?.remove();
      return;
    }
    if (Array.isArray(data)) {
      data = { "@context": "https://schema.org", "@graph": data };
    }
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  /**
   * @param {object} opts
   * @param {string} opts.title - Page title (without site suffix if using fullTitle)
   * @param {string} opts.description
   * @param {string} opts.path - URL path e.g. /projects
   * @param {string} [opts.image]
   * @param {string} [opts.type] - og:type
   * @param {object} [opts.settings] - site-settings.json
   * @param {object|object[]} [opts.jsonLd]
   * @param {boolean} [opts.noindex]
   * @param {string} [opts.canonicalPath] - override canonical path
   */
  function applyPortfolioSeo(opts) {
    const settings = opts.settings || null;
    const origin = siteOrigin(settings);
    const siteName = settings?.siteName || "saroj.dev";
    const defaultTitle = settings?.seo?.defaultTitle || siteName;
    const defaultDesc = settings?.seo?.defaultDescription || "";

    const rawTitle = opts.title || defaultTitle;
    const fullTitle =
      rawTitle.includes("–") || rawTitle.includes("|") ? rawTitle : `${rawTitle} – ${siteName}`;
    const description = opts.description || defaultDesc;
    const path = normalizePath(opts.canonicalPath || opts.path || location.pathname);
    const canonical = origin + (path === "/" ? "/" : path);
    const image = absoluteUrl(origin, opts.image || settings?.logo || "/img/saroj.png");
    const ogType = opts.type || "website";

    document.title = fullTitle;

    upsertMeta("name", "description", description);
    upsertLink("canonical", canonical);

    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", ogType);
    upsertMeta(
      "property",
      "og:site_name",
      settings?.seo?.structuredSiteName || siteName
    );
    upsertMeta("property", "og:locale", "en_US");
    upsertMeta("property", "og:image", image);
    upsertMeta(
      "property",
      "og:image:alt",
      settings?.seo?.ogImageAlt || settings?.seo?.defaultTitle || "Saroj Shrestha"
    );

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);

    if (opts.noindex) {
      upsertMeta("name", "robots", "noindex, follow");
    } else {
      upsertMeta("name", "robots", "index, follow, max-image-preview:large");
    }

    if (settings?.social?.length) {
      document.querySelectorAll('link[rel="me"]').forEach((n) => n.remove());
      settings.social.forEach((s) => {
        if (!s.url) return;
        const el = document.createElement("link");
        el.rel = "me";
        el.href = s.url;
        document.head.appendChild(el);
      });
    }

    setJsonLd(opts.jsonLd || null);
  }

  function personImageUrl(settings, origin) {
    const o = origin || siteOrigin(settings);
    return absoluteUrl(o, settings?.seo?.personImage || "/img/saroj.png");
  }

  function buildPersonNode(settings, origin) {
    const o = origin || siteOrigin(settings);
    const sameAs = (settings.social || []).map((s) => s.url).filter(Boolean);
    const img = personImageUrl(settings, o);
    return {
      "@type": "Person",
      "@id": o + "/#person",
      name: "Saroj Shrestha",
      givenName: "Saroj",
      familyName: "Shrestha",
      url: o + "/",
      jobTitle: "Umbraco & .NET Developer",
      description: settings.seo?.defaultDescription || settings.tagline || "",
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

  function buildWebsitePersonGraph(settings) {
    const origin = siteOrigin(settings);
    const img = personImageUrl(settings, origin);
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
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: img,
          },
        },
        person,
      ],
    };
  }

  function buildAboutProfileGraph(settings) {
    const origin = siteOrigin(settings);
    return {
      "@context": "https://schema.org",
      "@graph": [
        buildPersonNode(settings, origin),
        {
          "@type": "ProfilePage",
          "@id": origin + "/about#webpage",
          url: origin + "/about",
          name: "About Saroj Shrestha",
          description: settings.seo?.defaultDescription || "",
          isPartOf: { "@id": origin + "/#website" },
          mainEntity: { "@id": origin + "/#person" },
        },
      ],
    };
  }

  function buildProjectJsonLd(project, settings) {
    const origin = siteOrigin(settings);
    const url = origin + "/projects/" + project.slug;
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: project.title,
      description: project.description || project.longDescription,
      url,
      codeRepository: project.githubUrl || undefined,
      programmingLanguage: (project.technologies || []).join(", ") || undefined,
      image: project.thumbnail ? absoluteUrl(origin, project.thumbnail) : undefined,
      author: { "@id": origin + "/#person" },
    };
  }

  function buildBreadcrumbJsonLd(items, settings) {
    const origin = siteOrigin(settings);
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: origin + normalizePath(item.path),
      })),
    };
  }

  global.applyPortfolioSeo = applyPortfolioSeo;
  global.PortfolioSeo = {
    siteOrigin,
    absoluteUrl,
    personImageUrl,
    buildPersonNode,
    buildWebsitePersonGraph,
    buildAboutProfileGraph,
    buildProjectJsonLd,
    buildBreadcrumbJsonLd,
    DEFAULT_ORIGIN,
  };
})(window);
