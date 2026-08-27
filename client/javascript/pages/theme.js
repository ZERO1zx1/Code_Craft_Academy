const storageKey = "codecraft-academy-theme";

const preferredTheme = () => {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const updateControls = (theme) => {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const isDark = theme === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "Харанхуй горим идэвхтэй. Цайвар горимд шилжих" : "Цайвар горим идэвхтэй. Харанхуй горимд шилжих");
    button.title = isDark ? "Цайвар горимд шилжих" : "Харанхуй горимд шилжих";
    const symbol = button.querySelector(".theme-symbol");
    if (symbol) symbol.textContent = isDark ? "☼" : "◐";
    const label = button.querySelector(".theme-label");
    if (label) label.textContent = isDark ? "Цайвар" : "Харанхуй";
  });
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  updateControls(theme);
};

applyTheme(preferredTheme());

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try { window.localStorage.setItem(storageKey, nextTheme); } catch {}
    applyTheme(nextTheme);
  });
});
