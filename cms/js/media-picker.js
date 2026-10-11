/** Image path field + modal picker from the media library. */

export function imageFieldHtml(label, key, value, hint, escapeHtml) {
  const v = value ?? "";
  const preview = v
    ? `<img class="bo-image-preview" src="${escapeHtml(v)}" alt="" loading="lazy" />`
    : `<div class="bo-image-preview bo-image-preview--empty">No image</div>`;
  return `<div class="bo-field bo-image-field">
    <label>${label}</label>
    <div class="bo-image-row">
      <input data-key="${key}" value="${escapeHtml(v)}" placeholder="/img/…" />
      <button type="button" class="bo-btn" data-pick-image="${escapeHtml(key)}">Choose…</button>
    </div>
    ${preview}
    ${hint ? `<p class="hint">${hint}</p>` : ""}
  </div>`;
}

export function openMediaPicker({ items, onSelect, onClose }) {
  const existing = document.getElementById("bo-media-modal");
  existing?.remove();

  const root = document.createElement("div");
  root.id = "bo-media-modal";
  root.className = "bo-media-modal";
  root.innerHTML = `
    <div class="bo-media-modal-backdrop" data-close-modal></div>
    <div class="bo-media-modal-panel" role="dialog" aria-label="Choose image">
      <header class="bo-media-modal-head">
        <strong>Choose image</strong>
        <button type="button" class="bo-btn" data-close-modal>Close</button>
      </header>
      <p class="hint" style="padding:0 16px 8px;margin:0">Upload new files in the Media section (GitHub sign-in required).</p>
      <div class="bo-media-modal-grid"></div>
    </div>`;
  document.body.appendChild(root);

  const grid = root.querySelector(".bo-media-modal-grid");
  if (!items?.length) {
    grid.innerHTML = `<p class="bo-empty">No images in the library yet.</p>`;
  } else {
    grid.innerHTML = items
      .map(
        (m) =>
          `<button type="button" class="bo-media-pick" data-path="${encodeURIComponent(m.path)}" title="${m.path}">
            <img src="${m.path}" alt="" loading="lazy" /><span>${m.name}</span>
          </button>`
      )
      .join("");
  }

  const close = () => {
    root.remove();
    onClose?.();
  };

  root.querySelectorAll("[data-close-modal]").forEach((el) => el.addEventListener("click", close));
  root.querySelectorAll(".bo-media-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      onSelect(decodeURIComponent(btn.dataset.path));
      close();
    });
  });
}

export function wireImagePickers(form, doc, getMediaItems, onPicked) {
  if (!form) return;
  form.querySelectorAll("[data-pick-image]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.pickImage;
      openMediaPicker({
        items: getMediaItems() || [],
        onSelect: (path) => onPicked(key, path),
      });
    });
  });
}
