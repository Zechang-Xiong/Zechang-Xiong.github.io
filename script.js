const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;

if (!prefersReducedMotion.matches) {
  window.addEventListener("pointermove", (event) => {
    root.style.setProperty("--pointer-x", `${event.clientX}px`);
    root.style.setProperty("--pointer-y", `${event.clientY}px`);
  });
}

const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const sectionMap = new Map(
  navLinks
    .map((link) => {
      const target = document.querySelector(link.getAttribute("href"));
      return target ? [target.id, link] : null;
    })
    .filter(Boolean)
);

const revealTargets = document.querySelectorAll("[data-reveal]");

if (prefersReducedMotion.matches) {
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
    { threshold: 0.16 }
  );

  revealTargets.forEach((element) => revealObserver.observe(element));
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visibleEntries = entries.filter((entry) => entry.isIntersecting);

    visibleEntries.forEach((entry) => {
      navLinks.forEach((link) => link.classList.remove("is-active"));
      const activeLink = sectionMap.get(entry.target.id);
      if (activeLink) {
        activeLink.classList.add("is-active");
      }
    });
  },
  {
    rootMargin: "-30% 0px -55% 0px",
    threshold: [0.2, 0.45, 0.7],
  }
);

document.querySelectorAll("[data-section]").forEach((section) => {
  sectionObserver.observe(section);
});
