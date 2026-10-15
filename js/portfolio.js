(function () {
  const CONTENT = "/content/";

  function absUrl(path) {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("/")) return path;
    return "/" + path.replace(/^\.\//, "");
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed to load " + url);
    return res.json();
  }

  async function loadSiteSettings() {
    const data = await fetchJson(CONTENT + "site-settings.json");
    if (data.status === "draft") throw new Error("Site settings unpublished");
    return data;
  }

  async function loadProjects() {
    const index = await fetchJson(CONTENT + "projects/index.json");
    const slugs = index.slugs || [];
    const projects = await Promise.all(
      slugs.map((slug) => fetchJson(CONTENT + "projects/" + slug + ".json"))
    );
    return {
      index,
      projects: projects.filter((p) => p.status === "published"),
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderProjectCard(project, options) {
    const thumb = project.thumbnail
      ? `<div class="thumb"><img src="${absUrl(project.thumbnail)}" alt="${escapeHtml(project.thumbnailAlt || project.title)}" /></div>`
      : "";
    const toolsClass = project.thumbnail ? "tools" : "tools no-top";
    const tech = (project.technologies || [])
      .map((t) => `<li>${escapeHtml(t)}</li>`)
      .join("");
    const detailHref = absUrl("/projects/" + project.slug);
    const buttons = [];
    if (project.slug) {
      buttons.push(`<a class="gray-btn" href="${detailHref}">Details</a>`);
    }
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

  function applyNavigation(settings, activeHref) {
    const root = document.querySelector("[data-portfolio-nav-root]");
    const insertBefore = document.querySelector("[data-portfolio-nav-insert]");
    if (!root || !insertBefore || !settings.navigation) return;
    root.querySelectorAll("[data-dynamic-nav]").forEach((n) => n.remove());
    const normalized = activeHref === "/about-me" ? "/about" : activeHref;
    settings.navigation.forEach((item) => {
      const li = document.createElement("li");
      li.setAttribute("data-dynamic-nav", "1");
      const a = document.createElement("a");
      const active = normalized === item.href ? " active" : "";
      a.className = "nav-link" + active;
      a.href = item.href;
      a.textContent = item.label;
      li.appendChild(a);
      root.insertBefore(li, insertBefore);
    });
  }

  function applySeo(opts) {
    if (typeof applyPortfolioSeo === "function") applyPortfolioSeo(opts);
  }

  function pagePathFromFile(file) {
    return "/" + file.replace(/\.json$/i, "");
  }

  function applySiteChrome(settings) {
    document.querySelectorAll("[data-site-name]").forEach((el) => {
      el.textContent = settings.siteName || "saroj.dev";
    });
    document.querySelectorAll("[data-footer-blurb]").forEach((el) => {
      el.textContent = settings.footer?.blurb || "";
    });
    document.querySelectorAll("[data-copyright]").forEach((el) => {
      el.textContent = settings.footer?.copyright || "";
    });
    if (settings.favicon) {
      const icon = document.querySelector('link[rel="icon"]');
      if (icon) icon.href = absUrl(settings.favicon);
    }
    const socialRail = document.querySelector("[data-social-rail]");
    if (socialRail && settings.social) {
      socialRail.innerHTML =
        '<span class="social-line"></span>' +
        settings.social
          .map(
            (s) =>
              `<a class="soc" data-icon="${escapeHtml(s.id)}" href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(s.label)}"></a>`
          )
          .join("");
    }
    const footerMedia = document.querySelector("[data-footer-social]");
    if (footerMedia && settings.social) {
      footerMedia.innerHTML = settings.social
        .map(
          (s) =>
            `<li><a class="soc" data-icon="${escapeHtml(s.id)}" href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(s.label)}"></a></li>`
        )
        .join("");
    }
  }

  async function renderHome(settings) {
    const home = await fetchJson(CONTENT + "home.json");
    if (home.status !== "published") return;
    applySeo({
      settings,
      title: settings.seo?.defaultTitle,
      description: settings.seo?.defaultDescription || settings.tagline,
      path: "/",
      image: home.hero?.profileImage || "/img/saroj.png",
      jsonLd: window.PortfolioSeo?.buildWebsitePersonGraph(settings),
    });
    const { projects } = await loadProjects();
    const projHead = document.querySelector("[data-home-projects-heading]");
    if (projHead) projHead.textContent = home.projectsSection?.heading || "projects";
    const projView = document.querySelector("[data-home-projects-viewall]");
    if (projView) {
      projView.textContent = home.projectsSection?.viewAllLabel || "See all →";
      projView.href = absUrl(home.projectsSection?.viewAllHref || "/projects");
    }
    const skillsHead = document.querySelector("[data-home-skills-heading]");
    if (skillsHead) skillsHead.textContent = home.skillsSection?.heading || "skills";
    const contactHead = document.querySelector("[data-home-contact-heading]");
    if (contactHead) contactHead.textContent = home.contactSection?.heading || "contact";
    const hero = document.querySelector("[data-home-hero]");
    if (hero) {
      hero.innerHTML = `<div class="hero-copy">
        <h1>${escapeHtml(home.hero.heading)}<br><span class="accent">${escapeHtml(home.hero.headingAccent)}</span></h1>
        <p class="hero-sub">${escapeHtml(home.hero.subtitle)}</p>
        <a class="primary-btn" href="${escapeHtml(home.hero.cta.href)}">${escapeHtml(home.hero.cta.label)}</a>
      </div>
      <div class="hero-art">
        <div class="hero-frame">
          <img class="logo-outline animate-show-ltr" src="${absUrl("img/logo-outline.svg")}" alt="" decoding="async" />
          <img class="hero-photo" src="${absUrl(home.hero.profileImage)}" alt="${escapeHtml(home.hero.profileImageAlt)}" width="457" height="386" fetchpriority="high" decoding="async" />
          <img class="dots animate-show-rtl" src="${absUrl("img/dots.svg")}" alt="" decoding="async" />
        </div>
        <p class="status">
          <span class="status-dot" aria-hidden="true"></span>
          <span>${home.hero.statusText.replace("ZAAKS!", "<strong>ZAAKS!</strong>")}</span>
        </p>
      </div>`;
    }
    const quote = document.querySelector("[data-home-quote]");
    if (quote) {
      quote.innerHTML = `<p class="quote">${escapeHtml(home.quote.text)}</p>
        <span class="quote-author">- ${escapeHtml(home.quote.author)}</span>
        <span class="deco-square sm quote-sq animate-bounce-slow"></span>`;
    }
    const about = document.querySelector("[data-home-about]");
    if (about) {
      about.innerHTML = `<div class="about-copy">
          <h2 class="section-heading after">${escapeHtml(home.aboutSnippet.heading)}</h2>
          ${home.aboutSnippet.paragraphs.map((p) => `<p>${p.replace("ZAAKS!", "<strong>ZAAKS!</strong>")}</p>`).join("")}
          <a class="primary-btn" href="${escapeHtml(home.aboutSnippet.cta.href)}">${escapeHtml(home.aboutSnippet.cta.label)}</a>
        </div>
        <figure class="about-snippet-art">
          <img src="${absUrl(home.aboutSnippet.image)}" alt="${escapeHtml(home.aboutSnippet.imageAlt)}" width="480" height="360" loading="lazy" />
        </figure>`;
    }
    const grid = document.querySelector("[data-home-projects]");
    if (grid) {
      const featured = home.featuredProjectSlugs
        .map((slug) => projects.find((p) => p.slug === slug))
        .filter(Boolean);
      grid.innerHTML = featured.map((p) => renderProjectCard(p, { primary: true })).join("");
    }
    const skills = await fetchJson(CONTENT + "skills.json");
    const skillsRoot = document.querySelector("[data-home-skills]");
    if (skillsRoot && skills.status === "published") {
      skillsRoot.innerHTML = renderSkillsLayout(skills);
    }
    const contactLead = document.querySelector("[data-home-contact-lead]");
    if (contactLead) contactLead.textContent = home.contactSection.lead;
    const contactBox = document.querySelector("[data-home-contact-box]");
    if (contactBox && settings.social) {
      const boxHeading = home.contactSection?.messageBoxHeading || "Message me here";
      contactBox.innerHTML =
        `<h4>${escapeHtml(boxHeading)}</h4>` +
        settings.social
          .map(
            (s) =>
              `<a class="contact-row" href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer"><span class="soc" data-icon="${escapeHtml(s.id)}" aria-hidden="true"></span> ${escapeHtml(s.display || s.url)}</a>`
          )
          .join("");
    }
  }

  function renderSkillsLayout(skills) {
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
        <img class="logo-a" src="${absUrl("img/logo-outline.svg")}" alt="" decoding="async" loading="lazy" />
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

  async function renderProjectsPage(settings) {
    const { index, projects } = await loadProjects();
    applySeo({
      settings,
      title: index.title,
      description: index.subtitle,
      path: "/projects",
    });
    const mainHeading = document.querySelector("[data-projects-main-heading]");
    if (mainHeading) mainHeading.textContent = index.mainWorkHeading || "main-work";
    const smallHeading = document.querySelector("[data-projects-small-heading]");
    if (smallHeading) smallHeading.textContent = index.smallProjectsHeading || "small-projects";
    const title = document.querySelector("[data-projects-header]");
    if (title) {
      title.innerHTML = `<h2>${escapeHtml(index.title)}</h2><p>${escapeHtml(index.subtitle)}</p>`;
    }
    const main = document.querySelector("[data-projects-main]");
    const small = document.querySelector("[data-projects-small]");
    if (main) {
      main.innerHTML = projects
        .filter((p) => p.category === "main-work")
        .map((p) => renderProjectCard(p, { primary: true }))
        .join("");
    }
    if (small) {
      small.innerHTML = projects
        .filter((p) => p.category === "small-projects")
        .map((p) => renderProjectCard(p, { primary: false }))
        .join("");
    }
  }

  async function renderAboutPage(settings) {
    const about = await fetchJson(CONTENT + "about.json");
    if (about.status !== "published") return;
    const origin = window.PortfolioSeo?.siteOrigin(settings) || "https://saroj.dev";
    const isAboutMeAlias = /\/about-me(?:\.html)?$/i.test(location.pathname);
    applySeo({
      settings,
      title: about.heading,
      description: about.biography?.[0],
      path: "/about",
      noindex: isAboutMeAlias,
      image: about.profileImage || "/img/saroj.png",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        url: origin + "/about",
        mainEntity: { "@id": origin + "/#person" },
      },
    });
    const root = document.querySelector("[data-about-root]");
    if (!root) return;
    root.innerHTML = `<section class="about-hero about-page">
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
    </section>`;
  }

  async function renderContactPage(settings) {
    const contact = await fetchJson(CONTENT + "contact.json");
    applySeo({
      settings,
      title: contact.title,
      description: contact.lead || contact.subtitle,
      path: "/contact",
    });
    const header = document.querySelector("[data-contact-header]");
    if (header) {
      header.innerHTML = `<h2>${escapeHtml(contact.title)}</h2><p>${escapeHtml(contact.subtitle)}</p>`;
    }
    const lead = document.querySelector("[data-contact-lead]");
    if (lead) lead.textContent = contact.lead;
    const box = document.querySelector("[data-contact-box]");
    if (box && settings.social) {
      box.innerHTML =
        `<h4>${escapeHtml(contact.messageBoxHeading)}</h4>` +
        settings.social
          .map(
            (s) =>
              `<a class="contact-row" href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer"><span class="soc" data-icon="${escapeHtml(s.id)}" aria-hidden="true"></span> ${escapeHtml(s.display)}</a>`
          )
          .join("");
    }
    const media = document.querySelector("[data-contact-media]");
    if (media && settings.social) {
      media.innerHTML = settings.social
        .map(
          (s) =>
            `<a href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer"><span class="soc" data-icon="${escapeHtml(s.id)}" aria-hidden="true"></span> ${escapeHtml(s.display)}</a>`
        )
        .join("");
    }
  }

  async function renderListPage(file, rootSelector, renderItem, settings) {
    const data = await fetchJson(CONTENT + file);
    const root = document.querySelector(rootSelector);
    if (!root || data.status !== "published") return;
    applySeo({
      settings,
      title: data.title,
      description: data.subtitle,
      path: pagePathFromFile(file),
    });
    const header = root.querySelector("[data-list-header]");
    if (header) {
      header.innerHTML = `<h2>${escapeHtml(data.title)}</h2><p>${escapeHtml(data.subtitle)}</p>`;
    }
    const list = root.querySelector("[data-list-body]");
    if (list) {
      const items = data.items || [];
      list.innerHTML = items.length
        ? items.map(renderItem).join("")
        : `<p class="lead">Nothing published here yet. Add items in the portfolio CMS.</p>`;
    }
  }

  async function renderCustomPage(slug, settings) {
    const data = await fetchJson(CONTENT + "pages/" + slug + ".json");
    const root = document.querySelector("[data-custom-page-root]");
    if (!root) return;
    if (data.status !== "published") {
      root.innerHTML = '<p class="lead">This page is not published.</p>';
      return;
    }
    const desc = data.subtitle || (data.paragraphs && data.paragraphs[0]) || "";
    applySeo({
      settings,
      title: data.title || slug,
      description: desc,
      path: "/" + slug,
      image: data.heroImage,
    });
    const heroAlt = escapeHtml(data.heroImageAlt || data.title || slug);
    const hero = data.heroImage
      ? `<div class="thumb" style="max-width:560px;margin-bottom:1.5rem"><img src="${absUrl(data.heroImage)}" alt="${heroAlt}" loading="lazy" decoding="async" /></div>`
      : "";
    const body = (data.paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    root.innerHTML = `<div class="page-title"><h2>${escapeHtml(data.title || slug)}</h2>${data.subtitle ? `<p>${escapeHtml(data.subtitle)}</p>` : ""}</div>
      <section class="section">${hero}${body || "<p class=\"lead\">No content yet.</p>"}</section>`;
  }

  async function renderProjectDetail(slug, settings) {
    const project = await fetchJson(CONTENT + "projects/" + slug + ".json");
    project.slug = slug;
    if (project.status !== "published") {
      document.querySelector("[data-project-detail]").innerHTML =
        "<p class=\"lead\">This project is not published.</p>";
      return;
    }
    const PSeo = window.PortfolioSeo;
    applySeo({
      settings,
      title: project.title,
      description: project.description || project.longDescription,
      path: "/projects/" + slug,
      image: project.thumbnail,
      type: "article",
      jsonLd: PSeo
        ? [
            PSeo.buildProjectJsonLd(project, settings),
            PSeo.buildBreadcrumbJsonLd(
              [
                { name: "Home", path: "/" },
                { name: "Projects", path: "/projects" },
                { name: project.title, path: "/projects/" + slug },
              ],
              settings
            ),
          ]
        : null,
    });
    const root = document.querySelector("[data-project-detail]");
    if (!root) return;
    const gallery = (project.gallery || [])
      .map(
        (g, i) =>
          `<img src="${absUrl(g)}" alt="${escapeHtml(project.title + " screenshot " + (i + 1))}" loading="lazy" decoding="async" />`
      )
      .join("");
    root.innerHTML = `<div class="page-title">
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(project.description)}</p>
      </div>
      <section class="section">
        ${project.thumbnail ? `<div class="thumb" style="max-width:480px;margin-bottom:1.5rem"><img src="${absUrl(project.thumbnail)}" alt="${escapeHtml(project.thumbnailAlt || project.title)}" /></div>` : ""}
        <p class="lead">${escapeHtml(project.longDescription || project.description)}</p>
        <ul class="about-tags">${(project.technologies || []).map((t) => `<li class="about-tag">${escapeHtml(t)}</li>`).join("")}</ul>
        ${gallery ? `<div class="media-list" style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:1rem">${gallery}</div>` : ""}
        <div class="btns" style="margin-top:1.5rem">
          ${project.githubUrl ? `<a class="primary-btn" href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noreferrer">GitHub</a>` : ""}
          ${project.demoUrl ? `<a class="gray-btn" href="${escapeHtml(project.demoUrl)}" target="_blank" rel="noreferrer">Live demo</a>` : ""}
          <a class="gray-btn" href="${absUrl("/projects")}">All projects</a>
        </div>
      </section>`;
  }

  function portfolioReady() {
    document.documentElement.classList.remove("portfolio-loading");
    document.documentElement.classList.add("portfolio-ready");
    document.getElementById("portfolio-load-screen")?.remove();
  }

  async function init() {
    const page = document.body.dataset.page;
    if (!page) {
      portfolioReady();
      return;
    }
    try {
      const settings = await loadSiteSettings();
      applySiteChrome(settings);
      const path = location.pathname.replace(/\/$/, "") || "/";
      applyNavigation(settings, path === "/about-me" ? "/about" : path);

      if (page === "home") await renderHome(settings);
      if (page === "projects") await renderProjectsPage(settings);
      if (page === "about") await renderAboutPage(settings);
      if (page === "contact") await renderContactPage(settings);
      if (page === "experience") {
        await renderListPage("experience.json", "[data-experience-root]", (item) => `<article class="card" style="margin-bottom:1rem">
          <h3>${escapeHtml(item.role)} · ${escapeHtml(item.organization)}</h3>
          <p><em>${escapeHtml(item.startDate)} – ${escapeHtml(item.endDate)}</em>${item.location ? " · " + escapeHtml(item.location) : ""}</p>
          <p>${escapeHtml(item.description)}</p>
          ${item.achievements?.length ? `<ul>${item.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>` : ""}
        </article>`, settings);
      }
      if (page === "education") {
        await renderListPage("education.json", "[data-education-root]", (item) => `<article class="card" style="margin-bottom:1rem">
          <h3>${escapeHtml(item.qualification)}</h3>
          <p><strong>${escapeHtml(item.institution)}</strong></p>
          <p>${escapeHtml(item.description)}</p>
        </article>`, settings);
      }
      if (page === "skills") {
        const skills = await fetchJson(CONTENT + "skills.json");
        const root = document.querySelector("[data-skills-root]");
        if (root && skills.status === "published") {
          applySeo({
            settings,
            title: skills.title,
            description: skills.subtitle || skills.intro,
            path: "/skills",
          });
          const header = root.querySelector("[data-list-header]");
          if (header) header.innerHTML = `<h2>${escapeHtml(skills.title)}</h2><p>${escapeHtml(skills.subtitle)}</p>`;
          const body = root.querySelector("[data-skills-body]");
          if (body) body.innerHTML = renderSkillsLayout(skills);
        }
      }
      if (page === "certifications") {
        await renderListPage(
          "certifications.json",
          "[data-certifications-root]",
          (item) =>
            `<article class="card"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.issuer || "")} ${escapeHtml(item.date || "")}</p></article>`,
          settings
        );
      }
      if (page === "services") {
        await renderListPage(
          "services.json",
          "[data-services-root]",
          (item) =>
            `<article class="card" style="margin-bottom:1rem"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></article>`,
          settings
        );
      }
      if (page === "project-detail") {
        const slug = window.__PROJECT_SLUG__;
        if (slug) await renderProjectDetail(slug, settings);
      }
      if (page === "custom-page") {
        const slug = window.__PAGE_SLUG__;
        if (slug) await renderCustomPage(slug, settings);
      }

      if (window.rehydratePortfolioIcons) window.rehydratePortfolioIcons();
    } catch (err) {
      console.warn("Portfolio content render:", err);
    } finally {
      portfolioReady();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
