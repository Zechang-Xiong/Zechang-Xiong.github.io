const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const themeStorageKey = "theme";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const siteConfig = window.siteConfig || {};
const profile = siteConfig.profile || {};
const citationModal = {
  element: null,
  title: null,
  workTitle: null,
  bib: null,
  copyButton: null,
  lastTrigger: null,
  restoreTimer: null,
};

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

function createIcon(name) {
  const paths = {
    pdf: "M6 2h7l5 5v15H6V2Zm7 1.7V8h4.3L13 3.7ZM8 12h8v1.8H8V12Zm0 3.4h8v1.8H8v-1.8Z",
    code: "M8.7 16.3 4.4 12l4.3-4.3 1.4 1.4L7.2 12l2.9 2.9-1.4 1.4Zm6.6 0-1.4-1.4 2.9-2.9-2.9-2.9 1.4-1.4 4.3 4.3-4.3 4.3ZM11.2 18l-1.9-.6 3.5-11.4 1.9.6L11.2 18Z",
    cite: "M7.7 6.5c-1.8 1.3-2.7 2.9-2.7 4.8v5.2h6.1v-6H8.3c.1-.9.7-1.8 1.8-2.7L7.7 6.5Zm8 0c-1.8 1.3-2.7 2.9-2.7 4.8v5.2h6.1v-6h-2.8c.1-.9.7-1.8 1.8-2.7l-2.4-1.3Z",
    link: "M10.6 13.4a1 1 0 0 1 0-1.4l2.7-2.7a3 3 0 0 1 4.2 4.2l-2.1 2.1a3 3 0 0 1-4.2 0 1 1 0 1 1 1.4-1.4 1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0-1.4-1.4L12 13.4a1 1 0 0 1-1.4 0Zm2.8-2.8a1 1 0 0 1 0 1.4l-2.7 2.7a3 3 0 0 1-4.2-4.2l2.1-2.1a3 3 0 0 1 4.2 0 1 1 0 1 1-1.4 1.4 1 1 0 0 0-1.4 0L7.9 9.9a1 1 0 0 0 1.4 1.4l2.7-2.7a1 1 0 0 1 1.4 0Z",
    close: "m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z",
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svg.setAttribute("class", "action-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  path.setAttribute("d", paths[name] || paths.link);
  svg.append(path);
  return svg;
}

function createPublicationLink(label, url, iconName) {
  const link = createTextLink(label, url);
  if (!link) {
    return null;
  }

  link.className = "publication-action";
  link.replaceChildren(createIcon(iconName), createElement("span", "", label));
  return link;
}

function isProbablyUrl(value) {
  return typeof value === "string" && /^(https?:|mailto:|#)/i.test(value.trim());
}

function citationTextFor(item) {
  if (item.cite && typeof item.cite === "object" && !Array.isArray(item.cite)) {
    return firstDefined(item.cite.bib, item.cite.bibtex, item.cite.text, item.cite.citation);
  }

  const directCitation = firstDefined(item.bib, item.bibtex, item.citation, item.citeText);
  if (directCitation) {
    return directCitation;
  }

  if (typeof item.cite === "string" && !isProbablyUrl(item.cite)) {
    return item.cite;
  }

  return "";
}

function ensureCitationModal() {
  if (citationModal.element) {
    return;
  }

  const modal = createElement("div", "citation-modal");
  modal.setAttribute("hidden", "");

  const backdrop = createElement("button", "citation-backdrop");
  backdrop.type = "button";
  backdrop.setAttribute("aria-label", "Close citation dialog");

  const dialog = createElement("section", "citation-dialog");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "citation-dialog-title");

  const header = createElement("div", "citation-header");
  const title = createElement("h3", "", "BibTeX");
  title.id = "citation-dialog-title";
  const closeButton = createElement("button", "citation-close-button");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close citation dialog");
  closeButton.append(createIcon("close"));
  header.append(title, closeButton);

  const workTitle = createElement("p", "citation-work-title");
  const bib = createElement("pre", "citation-bib");
  const bibCode = createElement("code", "");
  bib.append(bibCode);

  const actions = createElement("div", "citation-actions");
  const copyButton = createElement("button", "citation-copy-button", "Copy BibTeX");
  copyButton.type = "button";
  actions.append(copyButton);

  dialog.append(header, workTitle, bib, actions);
  modal.append(backdrop, dialog);
  document.body.append(modal);

  citationModal.element = modal;
  citationModal.title = title;
  citationModal.workTitle = workTitle;
  citationModal.bib = bibCode;
  citationModal.copyButton = copyButton;

  backdrop.addEventListener("click", closeCitationModal);
  closeButton.addEventListener("click", closeCitationModal);
  copyButton.addEventListener("click", copyCitation);
}

function openCitationModal(workTitle, bibText, trigger) {
  ensureCitationModal();
  citationModal.lastTrigger = trigger;
  citationModal.workTitle.textContent = workTitle || "Citation";
  citationModal.bib.textContent = bibText;
  citationModal.copyButton.textContent = "Copy BibTeX";
  citationModal.element.removeAttribute("hidden");
  document.body.classList.add("has-modal");
  citationModal.copyButton.focus();
}

function closeCitationModal() {
  if (!citationModal.element || citationModal.element.hasAttribute("hidden")) {
    return;
  }

  citationModal.element.setAttribute("hidden", "");
  document.body.classList.remove("has-modal");
  if (citationModal.lastTrigger) {
    citationModal.lastTrigger.focus();
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = createElement("textarea", "");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto 0";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function copyCitation() {
  const bibText = citationModal.bib ? citationModal.bib.textContent : "";
  if (!bibText) {
    return;
  }

  try {
    await copyTextToClipboard(bibText);
    citationModal.copyButton.textContent = "Copied";
  } catch (error) {
    citationModal.copyButton.textContent = "Copy failed";
  }

  window.clearTimeout(citationModal.restoreTimer);
  citationModal.restoreTimer = window.setTimeout(() => {
    citationModal.copyButton.textContent = "Copy BibTeX";
  }, 1600);
}

function createCitationButton(item) {
  const bibText = citationTextFor(item);
  if (!bibText) {
    return null;
  }

  const button = createElement("button", "publication-action citation-trigger");
  button.type = "button";
  button.setAttribute("aria-haspopup", "dialog");
  button.append(createIcon("cite"), createElement("span", "", "Cite"));
  button.addEventListener("click", () => openCitationModal(item.title, bibText, button));
  return button;
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
      ? item.links.map((link) => createPublicationLink(link.label || "Link", link.url, link.icon || "link"))
      : [];
    const itemLinks = [
      createPublicationLink("PDF", firstDefined(item.pdf, item.pdfUrl), "pdf"),
      createPublicationLink("Code", firstDefined(item.code, item.codeUrl), "code"),
      createCitationButton(item),
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCitationModal();
  }
});

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
