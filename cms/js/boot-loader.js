/** Full-screen splash while CMS config and content load. */

export function hideBootLoader() {
  const boot = document.getElementById("bo-boot");
  if (!boot || boot.hasAttribute("hidden")) return;
  boot.classList.add("bo-boot--out");
  boot.setAttribute("aria-busy", "false");
  const done = () => {
    boot.setAttribute("hidden", "");
    boot.remove();
  };
  boot.addEventListener("transitionend", done, { once: true });
  setTimeout(done, 400);
}

export function showBootLoader() {
  const boot = document.getElementById("bo-boot");
  if (!boot) return;
  boot.classList.remove("bo-boot--out");
  boot.removeAttribute("hidden");
  boot.setAttribute("aria-busy", "true");
}
