const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const themeStorageKey = "theme";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function currentTheme() {
  return root.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function updateThemeToggle() {
  if (!themeToggle) {
    return;
  }

  const isLight = currentTheme() === "light";
  themeToggle.setAttribute("aria-pressed", String(isLight));
  themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");

  if (themeLabel) {
    themeLabel.textContent = isLight ? "Dark" : "Light";
  }
}

function applyTheme(theme, persist = true) {
  if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }

  if (persist) {
    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch (error) {
      // Theme switching should still work when storage is unavailable.
    }
  }

  updateThemeToggle();
}

try {
  const storedTheme = localStorage.getItem(themeStorageKey);
  if (storedTheme === "light" || storedTheme === "dark") {
    applyTheme(storedTheme, false);
  } else {
    updateThemeToggle();
  }
} catch (error) {
  updateThemeToggle();
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    applyTheme(currentTheme() === "light" ? "dark" : "light");
  });
}

const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const sectionMap = new Map(
  navLinks
    .map((link) => {
      const targetId = link.getAttribute("href");
      const target = targetId ? document.querySelector(targetId) : null;
      return target ? [target.id, link] : null;
    })
    .filter(Boolean)
);

const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));

if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealTargets.forEach((element) => revealObserver.observe(element));
}

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleEntries.length === 0) {
        return;
      }

      const activeLink = sectionMap.get(visibleEntries[0].target.id);
      navLinks.forEach((link) => link.classList.toggle("is-active", link === activeLink));
    },
    {
      rootMargin: "-24% 0px -58% 0px",
      threshold: [0.15, 0.35, 0.6],
    }
  );

  document.querySelectorAll("[data-section]").forEach((section) => {
    sectionObserver.observe(section);
  });
}
