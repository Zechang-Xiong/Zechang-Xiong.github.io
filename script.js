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

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function createTextLink(label, url) {
  if (!url) {
    return null;
  }

  const link = createElement("a", "", label);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function appendExternalLinks(container, links) {
  const validLinks = links.filter(Boolean);
  if (validLinks.length === 0) {
    return;
  }

  const linkGroup = createElement("div", "item-links");
  validLinks.forEach((link) => linkGroup.append(link));
  container.append(linkGroup);
}

function createPill(text, className = "") {
  return createElement("span", `meta-pill ${className}`.trim(), text);
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

  const card = createElement("article", "section-card");
  const newsList = createElement("ul", "bullet-list news-list");

  items.forEach((item) => {
    const row = createElement("li", "news-list-item");
    const body = createElement("div", "list-content");
    const heading = createElement("div", "list-heading news-heading");

    if (item.date) {
      const time = createElement("time", "list-date inline-date", formatDate(item.date));
      time.setAttribute("datetime", item.date);
      heading.append(time);
    }

    heading.append(createElement("h3", "", item.title));
    body.append(heading);

    if (item.summary) {
      body.append(createElement("p", "", item.summary));
    }

    const link = createTextLink("Read more", item.link);
    if (link) {
      appendExternalLinks(body, [link]);
    }

    row.append(body);
    newsList.append(row);
  });

  card.append(newsList);
  list.replaceChildren(card);
}

function renderResearch() {
  const list = document.querySelector("[data-research-list]");
  const items = siteConfig.researchInterests || [];
  if (!list) {
    return;
  }

  const card = createElement("article", "section-card");
  card.append(createElement("p", "section-card-intro", siteConfig.researchIntro || "My current research interests include:"));

  const bulletList = createElement("ul", "bullet-list");
  items.forEach((item) => {
    const row = createElement("li", "");
    row.append(createElement("h3", "", item.title), createElement("p", "", item.summary));
    bulletList.append(row);
  });

  card.append(bulletList);
  list.replaceChildren(card);
}

function renderPublications() {
  const list = document.querySelector("[data-publication-list]");
  const items = window.publicationItems || [];
  if (!list) {
    return;
  }

  const card = createElement("article", "section-card");
  const publicationList = createElement("ul", "bullet-list publication-list-items");

  items.forEach((item) => {
    const row = createElement("li", "publication-list-item");
    const body = createElement("div", "list-content publication-body");
    const title = createElement("h3", "publication-title");

    const venue = [item.venue, item.year].filter(Boolean).join(" · ");
    if (venue) {
      title.append(createElement("span", "publication-venue-inline", venue), document.createTextNode(` ${item.title}`));
    } else {
      title.textContent = item.title;
    }

    body.append(title);
    body.append(createElement("p", "publication-meta", item.authors));

    if (item.summary) {
      body.append(createElement("p", "", item.summary));
    }

    const infoRow = createElement("div", "publication-info-row");
    const dataLinks = Array.isArray(item.links)
      ? item.links.map((link) => createTextLink(link.label || "Link", link.url))
      : [];
    const itemLinks = [
      createTextLink("PDF", firstDefined(item.pdf, item.pdfUrl)),
      createTextLink("Code", firstDefined(item.code, item.codeUrl)),
      createTextLink("Cite", firstDefined(item.cite, item.citeUrl, item.bibtex)),
      ...dataLinks,
    ].filter(Boolean);

    itemLinks.forEach((link) => infoRow.append(link));

    const ratings = [
      firstDefined(item.ccf, item.ccfRating) ? `CCF ${firstDefined(item.ccf, item.ccfRating)}` : "",
      firstDefined(item.core, item.coreRating) ? `CORE ${firstDefined(item.core, item.coreRating)}` : "",
    ].filter(Boolean);

    ratings.forEach((rating) => infoRow.append(createPill(rating, "rating-pill")));
    if (infoRow.childElementCount > 0) {
      body.append(infoRow);
    }

    row.append(body);
    publicationList.append(row);
  });

  card.append(publicationList);
  list.replaceChildren(card);
}

function renderServices() {
  const list = document.querySelector("[data-service-list]");
  const items = siteConfig.services || [];
  if (!list) {
    return;
  }

  const card = createElement("article", "section-card");
  card.append(createElement("p", "section-card-intro", siteConfig.servicesIntro || "Selected academic service and professional activities include:"));

  const bulletList = createElement("ul", "bullet-list");
  items.forEach((item) => {
    const row = createElement("li", "service-list-item");
    row.append(createElement("h3", "", item.title));
    if (item.summary) {
      row.append(createElement("p", "", item.summary));
    }
    bulletList.append(row);
  });

  card.append(bulletList);
  list.replaceChildren(card);
}

function renderAwards() {
  const list = document.querySelector("[data-award-list]");
  const items = window.awardItems || [];
  if (!list) {
    return;
  }

  const card = createElement("article", "section-card");
  const awardList = createElement("ul", "bullet-list award-bullet-list");

  items.forEach((item) => {
    const row = createElement("li", "award-list-item");
    const body = createElement("div", "list-content");
    const heading = createElement("div", "list-heading award-heading");
    heading.append(
      createElement("span", "list-date inline-date", item.year || formatDate(item.date, { month: "short", year: "numeric" })),
      createElement("h3", "", item.title)
    );

    const issuer = firstDefined(item.issuer, item.organization);
    if (issuer) {
      heading.append(createElement("span", "award-issuer-inline", issuer));
    }
    body.append(heading);

    if (item.summary) {
      body.append(createElement("p", "", item.summary));
    }

    const link = createTextLink("Details", item.link);
    if (link) {
      appendExternalLinks(body, [link]);
    }

    row.append(body);
    awardList.append(row);
  });

  card.append(awardList);
  list.replaceChildren(card);
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
