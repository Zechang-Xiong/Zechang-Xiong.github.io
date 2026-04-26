const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const themeStorageKey = "theme";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const siteConfig = window.siteConfig || {};
const profile = siteConfig.profile || {};

function setText(selector, value) {
  if (!value) {
    return;
  }

  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}

function formatDate(dateValue, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en", options).format(date);
}

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

function renderProfile() {
  if (siteConfig.title) {
    document.title = `${siteConfig.title} | Homepage`;
  }

  const description = document.querySelector('meta[name="description"]');
  if (description && siteConfig.description) {
    description.setAttribute("content", siteConfig.description);
  }

  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon && siteConfig.favicon) {
    favicon.setAttribute("href", siteConfig.favicon);
  }

  setText("[data-profile-name]", profile.name);
  setText("[data-profile-role]", profile.role);
  setText("[data-profile-affiliation]", profile.affiliation);
  setText("[data-profile-location]", profile.location);
  setText("[data-current-year]", String(new Date().getFullYear()));

  const avatar = document.querySelector("[data-profile-avatar]");
  if (avatar && profile.avatar) {
    avatar.setAttribute("src", profile.avatar);
    avatar.setAttribute("alt", `${profile.name || "Profile"} portrait`);
  }

  const scholar = document.querySelector("[data-profile-scholar]");
  if (scholar && profile.googleScholar) {
    scholar.setAttribute("href", profile.googleScholar);
    if (profile.googleScholar !== "#") {
      scholar.setAttribute("target", "_blank");
      scholar.setAttribute("rel", "noopener noreferrer");
    }
  }

  const github = document.querySelector("[data-profile-github]");
  if (github && profile.github) {
    github.setAttribute("href", profile.github);
  }

  const email = document.querySelector("[data-profile-email]");
  if (email && profile.email) {
    email.setAttribute("href", `mailto:${profile.email}`);
  }

  const bio = document.querySelector("[data-profile-bio]");
  if (bio && Array.isArray(profile.bio)) {
    bio.replaceChildren(...profile.bio.map((paragraph) => createElement("p", "", paragraph)));
  }
}

function renderNews() {
  const list = document.querySelector("[data-news-list]");
  if (!list) {
    return;
  }

  const items = [...(window.newsItems || [])]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, 5);

  list.replaceChildren(
    ...items.map((item) => {
      const article = createElement("article", "timeline-item");
      const time = createElement("time", "", formatDate(item.date));
      if (item.date) {
        time.setAttribute("datetime", item.date);
      }

      const body = createElement("div");
      body.append(
        createElement("h3", "", item.title),
        createElement("p", "", item.summary)
      );

      if (item.link) {
        const link = createElement("a", "text-link", "Read more");
        link.href = item.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        body.append(link);
      }

      article.append(time, body);
      return article;
    })
  );
}

function renderResearch() {
  const list = document.querySelector("[data-research-list]");
  const items = siteConfig.researchInterests || [];
  if (!list) {
    return;
  }

  list.replaceChildren(
    ...items.map((item, index) => {
      const article = createElement("article", "info-card");
      article.append(
        createElement("span", "card-index", String(index + 1).padStart(2, "0")),
        createElement("h3", "", item.title),
        createElement("p", "", item.summary)
      );
      return article;
    })
  );
}

function renderPublications() {
  const list = document.querySelector("[data-publication-list]");
  const items = window.publicationItems || [];
  if (!list) {
    return;
  }

  list.replaceChildren(
    ...items.map((item) => {
      const article = createElement("article", "publication-item");
      const year = createElement("div", "publication-year", item.year);
      const body = createElement("div", "publication-body");
      body.append(
        createElement("h3", "", `[${item.venue}] ${item.title}`),
        createElement("p", "publication-authors", item.authors)
      );

      if (item.summary) {
        body.append(createElement("p", "", item.summary));
      }

      if (Array.isArray(item.links)) {
        const links = createElement("div", "item-links");
        links.setAttribute("aria-label", "Publication links");
        item.links
          .filter((link) => link.url)
          .forEach((link) => {
            const anchor = createElement("a", "", link.label || "Link");
            anchor.href = link.url;
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
            links.append(anchor);
          });
        if (links.childElementCount > 0) {
          body.append(links);
        }
      }

      article.append(year, body);
      return article;
    })
  );
}

function renderServices() {
  const list = document.querySelector("[data-service-list]");
  const items = siteConfig.services || [];
  if (!list) {
    return;
  }

  list.replaceChildren(
    ...items.map((item) => {
      const article = createElement("article", "info-card");
      article.append(createElement("h3", "", item.title), createElement("p", "", item.summary));
      return article;
    })
  );
}

function renderAwards() {
  const list = document.querySelector("[data-award-list]");
  const items = window.awardItems || [];
  if (!list) {
    return;
  }

  list.replaceChildren(
    ...items.map((item) => {
      const article = createElement("article", "award-item");
      const dateWrap = createElement("div", "award-date");
      dateWrap.append(createElement("span", "", item.year));
      
      const body = createElement("div");
      body.append(createElement("h3", "", item.title), createElement("p", "award-issuer", item.issuer));

      article.append(dateWrap, body);
      return article;
    })
  );
}

function renderContent() {
  renderProfile();
  renderNews();
  renderResearch();
  renderPublications();
  renderServices();
  renderAwards();
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

renderContent();

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
