const body = document.body;
const progress = document.getElementById("progress");
const themeToggle = document.getElementById("themeToggle");
const filters = document.querySelectorAll(".filter");
const timelineItems = document.querySelectorAll(".timeline-item");
const modal = document.getElementById("mediaModal");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const modalStage = document.getElementById("modalStage");
const modalPrev = document.getElementById("modalPrev");
const modalNext = document.getElementById("modalNext");
const mediaCards = document.querySelectorAll(".media-card");
const imageCards = Array.from(mediaCards).filter((card) => card.dataset.mediaType === "image");
const revealTargets = document.querySelectorAll(
  ".advantage-index, .advantage-copy > p, .advantage-points article, .section-heading, .about-lead, .strength-card, .media-card, .filters, .timeline-item, .skill-cloud span, .contact > *"
);
let activeImageIndex = -1;

const savedTheme = localStorage.getItem("profile-theme");
if (savedTheme === "dark") {
  body.classList.add("dark");
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark");
  localStorage.setItem("profile-theme", body.classList.contains("dark") ? "dark" : "light");
});

function updateScrollEffects() {
  const scrollTop = window.scrollY;
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = pageHeight > 0 ? scrollTop / pageHeight : 0;
  const heroRatio = Math.min(1, scrollTop / Math.max(1, window.innerHeight * 0.9));

  progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  document.documentElement.style.setProperty("--hero-drift", `${scrollTop * 0.2}px`);
  document.documentElement.style.setProperty("--hero-slide", `${heroRatio * 18}px`);
  document.documentElement.style.setProperty("--hero-scale", String(1.035 + heroRatio * 0.045));
  document.documentElement.style.setProperty("--hero-fade", String(Math.max(0.16, 1 - heroRatio * 1.08)));
  document.documentElement.style.setProperty("--hero-lift", `${heroRatio * 28}px`);
}

let scrollQueued = false;
window.addEventListener(
  "scroll",
  () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(() => {
      updateScrollEffects();
      scrollQueued = false;
    });
  },
  { passive: true }
);

updateScrollEffects();

revealTargets.forEach((item, index) => {
  item.classList.add("reveal");
  item.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 95}ms`);
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
  );

  revealTargets.forEach((item) => revealObserver.observe(item));
} else {
  revealTargets.forEach((item) => item.classList.add("is-visible"));
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("active", item === button));
    timelineItems.forEach((item) => {
      const visible = filter === "all" || item.dataset.kind === filter;
      item.classList.toggle("is-hidden", !visible);
    });
  });
});

const renderImage = (index) => {
  activeImageIndex = (index + imageCards.length) % imageCards.length;
  const card = imageCards[activeImageIndex];
  const image = document.createElement("img");
  image.src = card.dataset.src;
  image.alt = card.getAttribute("aria-label") || "";
  modalTitle.hidden = true;
  modalTitle.textContent = "";
  modalPrev.hidden = imageCards.length < 2;
  modalNext.hidden = imageCards.length < 2;
  modalStage.replaceChildren(image);
};

const showAdjacentImage = (direction) => {
  if (activeImageIndex < 0 || !modal.open) return;
  renderImage(activeImageIndex + direction);
};

mediaCards.forEach((card) => {
  const openCard = () => {
    const type = card.dataset.mediaType;
    const title = card.dataset.title || "媒体预览";
    const videoUrl = card.dataset.videoUrl;
    modalStage.replaceChildren();

    if (type === "image") {
      const imageIndex = imageCards.indexOf(card);
      renderImage(imageIndex > -1 ? imageIndex : 0);
    } else if (videoUrl) {
      window.open(videoUrl, "_blank", "noopener,noreferrer");
      return;
    } else {
      activeImageIndex = -1;
      modalPrev.hidden = true;
      modalNext.hidden = true;
      modalTitle.hidden = false;
      modalTitle.textContent = title;

      const preview = document.createElement("div");
      preview.className = "video-preview";
      preview.textContent = title;
      modalStage.appendChild(preview);
    }

    modal.showModal();
  };

  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      return;
    }
    openCard();
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCard();
    }
  });
});

modalClose.addEventListener("click", () => modal.close());

modalPrev.addEventListener("click", () => showAdjacentImage(-1));
modalNext.addEventListener("click", () => showAdjacentImage(1));

modal.addEventListener("click", (event) => {
  const rect = modal.getBoundingClientRect();
  const outside =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;
  if (outside) {
    modal.close();
  }
});

document.addEventListener("keydown", (event) => {
  if (!modal.open || activeImageIndex < 0) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showAdjacentImage(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    showAdjacentImage(1);
  }
});
