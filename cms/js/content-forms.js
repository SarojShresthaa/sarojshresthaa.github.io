/** Visual editors for list pages, custom pages, and site navigation. */

function itemCard(title, index, body, removeLabel = "Remove") {
  return `<div class="bo-repeater-card" data-item-index="${index}">
    <div class="bo-repeater-card-head"><strong>${title} ${index + 1}</strong>
      <button type="button" class="bo-btn danger bo-btn-sm" data-remove-item="${index}">${removeLabel}</button>
    </div>${body}</div>`;
}

export function renderListPageForm(doc, field, escapeHtml) {
  const d = doc.data;
  const id = doc.id;
  let repeater = "";
  let addLabel = "Add item";

  if (id === "experience") {
    addLabel = "Add experience";
    repeater = (d.items || [])
      .map((item, i) =>
        itemCard(
          "Role",
          i,
          `${field("Job title", `items.${i}.role`, item.role)}
          ${field("Organization", `items.${i}.organization`, item.organization)}
          ${field("Location", `items.${i}.location`, item.location)}
          ${field("Start", `items.${i}.startDate`, item.startDate)}
          ${field("End", `items.${i}.endDate`, item.endDate)}
          ${field("Description", `items.${i}.description`, item.description, "textarea")}
          ${field("Achievements (one per line)", `items.${i}._achievements`, (item.achievements || []).join("\n"), "textarea")}`
        )
      )
      .join("");
  } else if (id === "education") {
    addLabel = "Add education";
    repeater = (d.items || [])
      .map((item, i) =>
        itemCard(
          "Entry",
          i,
          `${field("Qualification", `items.${i}.qualification`, item.qualification)}
          ${field("Institution", `items.${i}.institution`, item.institution)}
          ${field("Description", `items.${i}.description`, item.description, "textarea")}`
        )
      )
      .join("");
  } else if (id === "certifications") {
    addLabel = "Add certification";
    repeater = (d.items || [])
      .map((item, i) =>
        itemCard(
          "Cert",
          i,
          `${field("Name", `items.${i}.name`, item.name)}
          ${field("Issuer", `items.${i}.issuer`, item.issuer)}
          ${field("Date", `items.${i}.date`, item.date)}`
        )
      )
      .join("");
  } else if (id === "services") {
    addLabel = "Add service";
    repeater = (d.items || [])
      .map((item, i) =>
        itemCard(
          "Service",
          i,
          `${field("Name", `items.${i}.name`, item.name)}
          ${field("Description", `items.${i}.description`, item.description, "textarea")}`
        )
      )
      .join("");
  } else {
    return null;
  }

  return `<h2>${escapeHtml(id)}</h2>
    ${field("Status", "status", d.status, "select-status")}
    ${field("Page title", "title", d.title)}
    ${field("Page subtitle", "subtitle", d.subtitle, "textarea")}
    <div class="bo-repeater" data-repeater="${id}">${repeater || `<p class="hint">No items yet.</p>`}</div>
    <button type="button" class="bo-btn" data-add-repeater="${id}">${addLabel}</button>`;
}

export function renderSkillsForm(d, field, imageField, escapeHtml) {
  const cols = (d.columns || [])
    .map(
      (col, i) =>
        itemCard(
          "Column",
          i,
          `${field("Title", `columns.${i}.title`, col.title)}
          ${field("Items (one per line)", `columns.${i}._items`, (col.items || []).join("\n"), "textarea")}`
        )
    )
    .join("");
  return `<h2>Skills</h2>
    ${field("Status", "status", d.status, "select-status")}
    ${field("Page title", "title", d.title)}
    ${field("Page subtitle", "subtitle", d.subtitle, "textarea")}
    ${field("Kicker", "kicker", d.kicker)}
    ${field("Intro", "intro", d.intro, "textarea")}
    <div class="bo-repeater" data-repeater="skills">${cols || `<p class="hint">No columns yet.</p>`}</div>
    <button type="button" class="bo-btn" data-add-repeater="skills">Add column</button>`;
}

export function renderCustomPageForm(d, field, imageField) {
  const paras = (d.paragraphs || []).join("\n\n");
  return `<h2>Custom page</h2>
    <p class="hint">Creates a new URL at <code>/${d.slug || "your-slug"}</code> after Save. Use <strong>Publish</strong> to show it on the live site.</p>
    ${field("Status", "status", d.status, "select-status")}
    ${field("Title", "title", d.title)}
    ${field("Slug", "slug", d.slug, "text", "Lowercase, hyphens — used in URL")}
    ${field("Subtitle", "subtitle", d.subtitle, "textarea")}
    ${imageField("Hero image", "heroImage", d.heroImage, "Optional banner image")}
    ${field("Body paragraphs", "_paragraphs", paras, "textarea", "Separate paragraphs with a blank line")}
    ${field("Nav label", "navLabel", d.navLabel, "text", "If set, can appear in the main menu when “Show in nav” is on")}
    ${field("Show in main navigation", "showInNav", d.showInNav, "checkbox")}`;
}

export function renderHomeForm(d, field, imageField) {
  const featured = (d.featuredProjectSlugs || []).join("\n");
  const bioBlocks = (d.aboutSnippet?.paragraphs || [])
    .map((p, i) => field(`About paragraph ${i + 1}`, `aboutSnippet.paragraphs.${i}`, p, "textarea"))
    .join("");
  return `<h2>Home</h2>
    ${field("Status", "status", d.status, "select-status")}
    <h3 class="bo-form-section">Hero</h3>
    ${field("Heading", "hero.heading", d.hero?.heading)}
    ${field("Heading accent", "hero.headingAccent", d.hero?.headingAccent)}
    ${field("Subtitle", "hero.subtitle", d.hero?.subtitle, "textarea")}
    ${imageField("Profile image", "hero.profileImage", d.hero?.profileImage)}
    ${field("Profile image alt", "hero.profileImageAlt", d.hero?.profileImageAlt)}
    ${field("Status line", "hero.statusText", d.hero?.statusText, "textarea", "Shown under hero photo")}
    ${field("Hero CTA label", "hero.cta.label", d.hero?.cta?.label)}
    ${field("Hero CTA link", "hero.cta.href", d.hero?.cta?.href)}
    <h3 class="bo-form-section">Quote</h3>
    ${field("Quote text", "quote.text", d.quote?.text, "textarea")}
    ${field("Quote author", "quote.author", d.quote?.author)}
    <h3 class="bo-form-section">About snippet</h3>
    ${field("Section heading", "aboutSnippet.heading", d.aboutSnippet?.heading)}
    ${bioBlocks || field("About paragraph 1", "aboutSnippet.paragraphs.0", d.aboutSnippet?.paragraphs?.[0], "textarea")}
    ${field("About paragraph 2", "aboutSnippet.paragraphs.1", d.aboutSnippet?.paragraphs?.[1], "textarea")}
    ${imageField("About image", "aboutSnippet.image", d.aboutSnippet?.image)}
    ${field("About image alt", "aboutSnippet.imageAlt", d.aboutSnippet?.imageAlt)}
    ${field("About CTA label", "aboutSnippet.cta.label", d.aboutSnippet?.cta?.label)}
    ${field("About CTA link", "aboutSnippet.cta.href", d.aboutSnippet?.cta?.href)}
    <h3 class="bo-form-section">Featured projects</h3>
    ${field("Section heading", "projectsSection.heading", d.projectsSection?.heading, "text", "Home page projects block")}
    ${field("View all label", "projectsSection.viewAllLabel", d.projectsSection?.viewAllLabel)}
    ${field("View all link", "projectsSection.viewAllHref", d.projectsSection?.viewAllHref)}
    ${field("Featured slugs (one per line)", "_featuredSlugs", featured, "textarea", "Must match project slugs")}
    <h3 class="bo-form-section">Skills block (home)</h3>
    ${field("Section heading", "skillsSection.heading", d.skillsSection?.heading)}
    ${field("Kicker", "skillsSection.kicker", d.skillsSection?.kicker)}
    ${field("Intro", "skillsSection.intro", d.skillsSection?.intro, "textarea")}
    <h3 class="bo-form-section">Contact block (home)</h3>
    ${field("Section heading", "contactSection.heading", d.contactSection?.heading)}
    ${field("Lead", "contactSection.lead", d.contactSection?.lead, "textarea")}
    ${field("Message box heading", "contactSection.messageBoxHeading", d.contactSection?.messageBoxHeading)}`;
}

export function renderAboutForm(d, field, imageField, escapeHtml) {
  const bio = (d.biography || [])
    .map(
      (p, i) =>
        itemCard(
          "Paragraph",
          i,
          field("Text", `biography.${i}`, p, "textarea")
        )
    )
    .join("");
  return `<h2>About</h2>
    ${field("Status", "status", d.status, "select-status")}
    ${field("Eyebrow", "eyebrow", d.eyebrow)}
    ${field("Page heading", "heading", d.heading)}
    ${imageField("Profile image", "profileImage", d.profileImage)}
    ${field("Profile image alt", "profileImageAlt", d.profileImageAlt)}
    <h3 class="bo-form-section">Biography</h3>
    <div class="bo-repeater" data-repeater="biography">${bio || `<p class="hint">No paragraphs yet.</p>`}</div>
    <button type="button" class="bo-btn" data-add-repeater="biography">Add paragraph</button>
    <h3 class="bo-form-section">Work section</h3>
    ${field("Kicker", "workSection.kicker", d.workSection?.kicker)}
    ${field("Heading", "workSection.heading", d.workSection?.heading)}
    ${field("Intro", "workSection.intro", d.workSection?.intro, "textarea")}
    ${field("Tags (one per line)", "workSection._tags", (d.workSection?.tags || []).join("\n"), "textarea")}
    <h3 class="bo-form-section">Life section</h3>
    ${field("Kicker", "lifeSection.kicker", d.lifeSection?.kicker)}
    ${field("Heading", "lifeSection.heading", d.lifeSection?.heading)}
    ${field("Intro", "lifeSection.intro", d.lifeSection?.intro, "textarea")}
    ${field("Tags (one per line)", "lifeSection._tags", (d.lifeSection?.tags || []).join("\n"), "textarea")}`;
}

export const SITE_SETTINGS_TABS = [
  { id: "general", label: "General" },
  { id: "cms", label: "CMS & login" },
  { id: "seo", label: "SEO" },
  { id: "social", label: "Social" },
  { id: "nav", label: "Navigation" },
  { id: "info", label: "Info" },
];

export function renderSiteSettingsForm(d, field, imageField, escapeHtml, settingsTab = "general") {
  const social = (d.social || [])
    .map(
      (s, i) =>
        itemCard(
          "Social link",
          i,
          `${field("ID (icon key)", `social.${i}.id`, s.id, "text", "e.g. github, linkedin")}
          ${field("Label", `social.${i}.label`, s.label)}
          ${field("URL", `social.${i}.url`, s.url)}
          ${field("Display text", `social.${i}.display`, s.display)}`
        )
    )
    .join("");

  if (settingsTab === "general") {
    return `<h2>General</h2>
      <p class="hint">${escapeHtml(d.cmsNotice || "Site-wide name, logo, and footer shown on the public portfolio.")}</p>
      ${field("Status", "status", d.status, "select-status")}
      ${field("Site name", "siteName", d.siteName)}
      ${field("Tagline", "tagline", d.tagline)}
      ${imageField("Logo / icon path", "logo", d.logo, "Public site header")}
      ${imageField("Favicon", "favicon", d.favicon)}
      ${field("Footer blurb", "footer.blurb", d.footer?.blurb, "textarea")}
      ${field("Copyright", "footer.copyright", d.footer?.copyright)}`;
  }
  if (settingsTab === "cms") {
    return `<h2>CMS & login</h2>
      <p class="hint">Left rail logo and login screen. Use <strong>Choose…</strong> for images, or a letter when no image.</p>
      ${field("Rail logo letter", "cmsBranding.logoText", d.cmsBranding?.logoText ?? "P", "text", "1–2 characters if no image")}
      ${imageField("Rail logo image", "cmsBranding.logoImage", d.cmsBranding?.logoImage, "Overrides letter when set")}
      ${field("Use same logo on login screen", "cmsBranding.useSameLogoForLogin", d.cmsBranding?.useSameLogoForLogin !== false, "checkbox")}
      ${field("Login logo letter", "cmsBranding.loginLogoText", d.cmsBranding?.loginLogoText, "text", "Only if not using same logo")}
      ${imageField("Login logo image", "cmsBranding.loginLogoImage", d.cmsBranding?.loginLogoImage, "Only if not using same logo")}
      ${field("Login title", "cmsBranding.loginTitle", d.cmsBranding?.loginTitle ?? "Portfolio CMS")}
      ${field("Login subtitle", "cmsBranding.loginSubtitle", d.cmsBranding?.loginSubtitle, "textarea")}`;
  }
  if (settingsTab === "seo") {
    return `<h2>SEO defaults</h2>
      <p class="hint">Default meta title and description for the public site (pages can override).</p>
      ${field("Default title", "seo.defaultTitle", d.seo?.defaultTitle)}
      ${field("Default description", "seo.defaultDescription", d.seo?.defaultDescription, "textarea")}`;
  }
  if (settingsTab === "social") {
    return `<h2>Social links</h2>
      <p class="hint">Used in the header rail, footer, and contact areas on the live site.</p>
      <div class="bo-repeater" data-repeater="social">${social || `<p class="hint">No social links.</p>`}</div>
      <button type="button" class="bo-btn" data-add-repeater="social">Add social link</button>`;
  }
  if (settingsTab === "nav") {
    return `<h2>Navigation</h2>
      ${renderNavigationForm(d, field)}`;
  }
  return `<h2>Site settings</h2><p class="hint">Choose a tab above.</p>`;
}

export function renderContactForm(d, field) {
  return `<h2>Contact page</h2>
    ${field("Status", "status", d.status, "select-status")}
    ${field("Page title", "title", d.title)}
    ${field("Subtitle", "subtitle", d.subtitle)}
    ${field("Lead paragraph", "lead", d.lead, "textarea")}
    ${field("Message box heading", "messageBoxHeading", d.messageBoxHeading)}
    ${field("Media section heading", "mediaSectionHeading", d.mediaSectionHeading)}`;
}

export function renderProjectForm(d, field, imageField) {
  const gallery = (d.gallery || []).join("\n");
  return `${field("Status", "status", d.status, "select-status")}
    ${field("Title", "title", d.title)}
    ${field("Slug", "slug", d.slug, "text", "Used in /projects/slug")}
    ${field("Category", "category", d.category, "text", "main-work or small-projects")}
    ${field("Description", "description", d.description, "textarea")}
    ${field("Long description", "longDescription", d.longDescription, "textarea")}
    ${imageField("Thumbnail", "thumbnail", d.thumbnail)}
    ${field("Thumbnail alt", "thumbnailAlt", d.thumbnailAlt)}
    ${field("Gallery images (one path per line)", "_gallery", gallery, "textarea", "Use Choose on thumbnail; paste paths or pick from Media")}
    ${field("Technologies (comma-separated)", "_technologies", (d.technologies || []).join(", "))}
    ${field("GitHub URL", "githubUrl", d.githubUrl)}
    ${field("Demo URL", "demoUrl", d.demoUrl)}
    ${field("Featured on home", "featured", d.featured, "checkbox")}`;
}

export function renderProjectsIndexForm(d, field, escapeHtml) {
  const slugList = (d.slugs || []).join("\n");
  return `<h2>Projects page</h2>
    <p class="hint">Controls <code>/projects</code> copy and section headings. Open each project under the tree to edit cards.</p>
    ${field("Status", "status", d.status, "select-status")}
    ${field("Page title", "title", d.title)}
    ${field("Page subtitle", "subtitle", d.subtitle, "textarea")}
    ${field("Main work section heading", "mainWorkHeading", d.mainWorkHeading)}
    ${field("Small projects section heading", "smallProjectsHeading", d.smallProjectsHeading)}
    ${field("Project order (slugs, one per line)", "_slugOrder", slugList, "textarea", "Must match existing project slugs")}`;
}

export function renderNavigationForm(d, field) {
  const nav = d.navigation || [];
  const rows = nav
    .map(
      (item, i) =>
        itemCard(
          "Link",
          i,
          `${field("Label", `navigation.${i}.label`, item.label)}
          ${field("URL path", `navigation.${i}.href`, item.href, "text", "e.g. /projects or /my-page")}`
        )
    )
    .join("");
  return `<h3 style="margin-top:24px">Main navigation</h3>
    <p class="hint">Menu links across the site. Add a link when you create a new custom page.</p>
    <div class="bo-repeater" data-repeater="navigation">${rows || `<p class="hint">No links.</p>`}</div>
    <button type="button" class="bo-btn" data-add-repeater="navigation">Add nav link</button>`;
}

export const REPEATER_DEFAULTS = {
  experience: {
    id: "item",
    organization: "",
    role: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
    achievements: [],
  },
  education: { qualification: "", institution: "", description: "" },
  certifications: { name: "", issuer: "", date: "" },
  services: { name: "", description: "" },
  skills: { title: "", items: [] },
  navigation: { label: "", href: "/" },
  social: { id: "", label: "", url: "", display: "" },
  biography: "",
};

export const RESERVED_PAGE_SLUGS = new Set([
  "home",
  "index",
  "projects",
  "about",
  "about-me",
  "contact",
  "experience",
  "education",
  "skills",
  "certifications",
  "services",
  "cms",
  "admin",
  "portfolio",
  "oauth-callback",
]);
