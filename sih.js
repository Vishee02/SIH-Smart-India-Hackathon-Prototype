document.addEventListener("DOMContentLoaded", () => {
  // --- Smooth Scrolling for Navigation Links ---
  const nav = document.getElementById("primaryNav");
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      const targetElem = document.getElementById(targetId);
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: "smooth", block: "start" });
        targetElem.setAttribute("tabindex", "-1");
        targetElem.focus();
        logInteraction(`Navigated to section: ${targetId}`);
        // Close mobile nav after click
        const toggleBtn = document.getElementById("navToggle");
        if (toggleBtn && nav && nav.classList.contains("open")) {
          nav.classList.remove("open");
          toggleBtn.setAttribute("aria-expanded", "false");
        }
      }
    });
  });

  // --- Mobile nav toggle ---
  const navToggle = document.getElementById("navToggle");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      logInteraction(`Nav toggled: ${isOpen ? "open" : "closed"}`);
    });
  }

  // --- Intersection Observer for Section Fade-In ---
  const sections = document.querySelectorAll("section");
  const observerOptions = { threshold: 0.15 };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
        logInteraction(`Section visible: ${entry.target.id}`);
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));

  // --- Scrollspy: set active nav link based on visible section ---
  setupScrollSpy();

  // --- Contact Form Modal Setup (avoid duplicates if modal exists in HTML) ---
  if (
    !document.getElementById("modalBackdrop") &&
    !document.getElementById("contactModal")
  ) {
    setupContactForm();
  }

  // --- Dark/Light Mode Toggle ---
  if (typeof setupDarkModeToggle === "function") {
    setupDarkModeToggle();
  }

  // --- Back to Top Button (skip if button already exists in HTML) ---
  if (!document.getElementById("backToTop")) {
    setupBackToTopButton();
  }

  // --- Set sticky header offset for smooth anchor scrolling ---
  updateStickyOffset();
  window.addEventListener("resize", debounce(updateStickyOffset, 150));

  // --- Log page load ---
  logInteraction("Page loaded");
});

// --- Interaction Logger ---
function logInteraction(message) {
  const timestamp = new Date().toISOString();
  console.log(`[User Interaction] ${timestamp}: ${message}`);
}

// --- Contact Form Modal and Validation ---
function setupContactForm() {
  const modalHTML = `
    <div id="contactModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" aria-hidden="true" tabindex="-1" style="display:none;">
      <div class="modal-content" role="document">
        <button class="modal-close" aria-label="Close contact form">&times;</button>
        <h2 id="modalTitle">Send us a Message</h2>
        <form id="contactForm" novalidate>
          <label for="nameInput">Name:</label>
          <input type="text" id="nameInput" name="name" required minlength="2" />
          
          <label for="emailInput">Email:</label>
          <input type="email" id="emailInput" name="email" required />
          
          <label for="messageInput">Message:</label>
          <textarea id="messageInput" name="message" required minlength="10"></textarea>
          
          <button type="submit" class="cta-btn">Send</button>
        </form>
        <div id="formStatus" aria-live="polite"></div>
      </div>
    </div>
    <div id="modalBackdrop" class="modal-backdrop" style="display:none;"></div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const modal = document.getElementById("contactModal");
  const backdrop = document.getElementById("modalBackdrop");
  const openBtn = document.getElementById("contactBtn");
  const closeBtn = modal.querySelector(".modal-close");
  const form = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");

  // Open modal
  openBtn.addEventListener("click", () => {
    modal.style.display = "block";
    backdrop.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector("#nameInput").focus();
    logInteraction("Contact form opened");
  });

  // Close modal helper
  function closeModal() {
    modal.style.display = "none";
    backdrop.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    openBtn.focus();
    formStatus.textContent = "";
    form.reset();
    logInteraction("Contact form closed");
  }

  // Close modal handlers
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "block") {
      closeModal();
    }
  });

  // Form validation
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    formStatus.textContent = "";
    if (!form.checkValidity()) {
      formStatus.textContent = "Please fill out all fields correctly.";
      formStatus.style.color = "red";
      return;
    }
    formStatus.textContent = "Sending...";
    formStatus.style.color = "black";

    setTimeout(() => {
      formStatus.textContent = "Message sent successfully! Thank you.";
      formStatus.style.color = "green";
      logInteraction("Contact form submitted");
      setTimeout(closeModal, 3000);
    }, 2000);
  });
}

// --- Back to Top Button Setup ---
function setupBackToTopButton() {
  const btn = document.createElement("button");
  btn.id = "backToTop";
  btn.textContent = "↑ Top";
  btn.setAttribute("aria-label", "Back to top");
  btn.style.position = "fixed";
  btn.style.bottom = "2rem";
  btn.style.right = "2rem";
  btn.style.padding = "0.5rem 1rem";
  btn.style.fontSize = "1.2rem";
  btn.style.display = "none";
  btn.style.zIndex = "1000";
  btn.className = "cta-btn";

  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      btn.style.display = "block";
    } else {
      btn.style.display = "none";
    }
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    logInteraction("Back to top clicked");
  });
}

// --- Scrollspy implementation ---
function setupScrollSpy() {
  const sections = document.querySelectorAll("main section[id]");
  const links = Array.from(document.querySelectorAll('nav a[href^="#"]'));
  const linkMap = new Map(
    links.map((a) => [a.getAttribute("href").substring(1), a])
  );

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        const link = linkMap.get(id);
        if (!link) return;
        if (entry.isIntersecting) {
          // Clear previous active states
          links.forEach((l) => {
            l.classList.remove("active");
            l.removeAttribute("aria-current");
          });
          link.classList.add("active");
          link.setAttribute("aria-current", "page");
        }
      });
    },
    { threshold: 0.6, rootMargin: "0px 0px -20% 0px" }
  );

  sections.forEach((sec) => obs.observe(sec));
}

// --- Sticky header offset helper ---
function updateStickyOffset() {
  const header = document.querySelector("header");
  const height = header ? header.offsetHeight : 0;
  document.documentElement.style.setProperty(
    "--sticky-offset",
    `${height + 8}px`
  ); // extra padding
}

// --- Small debounce utility ---
function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// --- Optional dark mode stub (prevents runtime errors if not implemented) ---
function setupDarkModeToggle() {
  /* no-op stub; implement if needed */
}
