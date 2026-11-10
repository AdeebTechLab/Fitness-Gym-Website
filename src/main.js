document.documentElement.classList.add("js");

async function loadComponent(host) {
  const name = host.dataset.component;
  const componentUrl = new URL(`../components/${name}.html`, import.meta.url);

  try {
    const response = await fetch(componentUrl);
    if (!response.ok) {
      throw new Error(`Failed to load ${name} component: HTTP ${response.status}`);
    }

    host.innerHTML = await response.text();
  } catch (error) {
    host.setAttribute("role", "alert");
    host.textContent = `Unable to load the ${name} page component. Please refresh the page.`;
    console.error(error);
    throw error;
  }
}

await Promise.all(
  [...document.querySelectorAll("[data-component]")].map(loadComponent)
);

const revealElements = document.querySelectorAll(
  ".section-heading, .class-card, .equipment-card, .plan, .coach-card, .quote-card, .visit-panel, .benefit"
);
const animationByClass = new Map([
  ["plan", "zoom-in"],
  ["visit-panel", "fade-left"]
]);

revealElements.forEach((element, index) => {
  const animation = [...element.classList]
    .map((name) => animationByClass.get(name))
    .find(Boolean) || "fade-up";
  element.dataset.aos = animation;
  element.style.setProperty("--aos-delay", `${Math.min(index % 3, 2) * 90}ms`);
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();
