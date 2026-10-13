document.documentElement.classList.add("portfolio-loading");

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("portfolio-load-screen")) return;
  var screen = document.createElement("div");
  screen.id = "portfolio-load-screen";
  screen.setAttribute("role", "status");
  screen.setAttribute("aria-live", "polite");
  screen.setAttribute("aria-label", "Loading site");
  screen.innerHTML =
    '<div class="portfolio-load-spinner" aria-hidden="true"></div>' +
    '<span class="portfolio-load-label">$ loading…</span>';
  document.body.insertBefore(screen, document.body.firstChild);
});
