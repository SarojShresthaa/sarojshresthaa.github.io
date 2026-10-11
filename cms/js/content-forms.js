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
