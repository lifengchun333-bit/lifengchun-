const body = document.body;
const progress = document.getElementById("progress");
const themeToggle = document.getElementById("themeToggle");
const editToggle = document.getElementById("editToggle");
const editAdd = document.getElementById("editAdd");
const editReset = document.getElementById("editReset");
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
const editableStorageKey = "profile-site-edits-v1";
const editableSizeStorageKey = "profile-site-edit-sizes-v1";
const customBlocksStorageKey = "profile-site-custom-blocks-v1";
const editModeKey = "profile-site-edit-mode";
let activeImageIndex = -1;

const savedTheme = localStorage.getItem("profile-theme");
if (savedTheme === "dark") {
  body.classList.add("dark");
}

const editableSelectors = [
  ".brand",
  ".eyebrow",
  "h1",
  "h2",
  "h3",
  "p",
  "li",
  ".advantage-index > span",
  ".advantage-points strong",
  ".advantage-points span",
  ".skill-cloud span",
  ".video-kicker",
];

let editableNodes = Array.from(document.querySelectorAll(editableSelectors.join(","))).filter((node) => {
  return node.closest("main, header") && !node.closest("a, button, dialog, .filters");
});

const storedEdits = JSON.parse(localStorage.getItem(editableStorageKey) || "{}");
const storedSizes = JSON.parse(localStorage.getItem(editableSizeStorageKey) || "{}");
const storedCustomBlocks = JSON.parse(localStorage.getItem(customBlocksStorageKey) || "[]");

function saveEditableText(node) {
  const id = node.dataset.editable;
  if (!id) return;
  const edits = JSON.parse(localStorage.getItem(editableStorageKey) || "{}");
  edits[id] = node.innerText;
  localStorage.setItem(editableStorageKey, JSON.stringify(edits));
}

function saveEditableSize(node) {
  const id = node.dataset.editable;
  if (!id || !body.classList.contains("editing")) return;
  const rect = node.getBoundingClientRect();
  if (rect.width < 40 || rect.height < 20) return;
  const sizes = JSON.parse(localStorage.getItem(editableSizeStorageKey) || "{}");
  sizes[id] = {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
  localStorage.setItem(editableSizeStorageKey, JSON.stringify(sizes));
}

function registerEditable(node, index = editableNodes.length) {
  const id = node.dataset.editable || node.id || `editable-${index}`;
  node.dataset.editable = id;
  if (Object.prototype.hasOwnProperty.call(storedEdits, id)) {
    node.innerText = storedEdits[id];
  }
  if (storedSizes[id]) {
    node.style.width = `${storedSizes[id].width}px`;
    node.style.minHeight = `${storedSizes[id].height}px`;
  }
  node.addEventListener("input", () => {
    saveEditableText(node);
    saveCustomBlocks();
  });
  node.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      node.blur();
    }
  });
}

function saveCustomBlocks() {
  const blocks = Array.from(document.querySelectorAll(".custom-text-block")).map((block) => {
    const rect = block.getBoundingClientRect();
    return {
      id: block.dataset.editable,
      text: block.innerText,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  });
  localStorage.setItem(customBlocksStorageKey, JSON.stringify(blocks));
}

function createCustomBlock(block = {}) {
  const element = document.createElement("div");
  element.className = "custom-text-block";
  element.dataset.editable = block.id || `custom-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  element.innerText = block.text || "在这里输入新的文字内容";
  if (block.width) element.style.width = `${block.width}px`;
  if (block.height) element.style.minHeight = `${block.height}px`;
  return element;
}

storedCustomBlocks.forEach((block) => {
  const target = document.querySelector("#contact") || document.querySelector("main");
  const element = createCustomBlock(block);
  target.parentNode.insertBefore(element, target);
  editableNodes.push(element);
});

editableNodes.forEach((node, index) => registerEditable(node, index));

function setEditMode(enabled) {
  body.classList.toggle("editing", enabled);
  editToggle.classList.toggle("is-active", enabled);
  editToggle.setAttribute("aria-pressed", String(enabled));
  editToggle.textContent = enabled ? "完成" : "编辑";
  editableNodes.forEach((node) => {
    node.contentEditable = String(enabled);
    node.spellcheck = false;
  });
  localStorage.setItem(editModeKey, enabled ? "on" : "off");
}

function getCurrentSection() {
  const sections = Array.from(document.querySelectorAll("main > section"));
  const middle = window.scrollY + window.innerHeight * 0.42;
  return (
    sections.find((section) => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      return middle >= top && middle <= bottom;
    }) || sections[sections.length - 1]
  );
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark");
  localStorage.setItem("profile-theme", body.classList.contains("dark") ? "dark" : "light");
});

editToggle.addEventListener("click", () => {
  setEditMode(!body.classList.contains("editing"));
});

editAdd.addEventListener("click", () => {
  setEditMode(true);
  const section = getCurrentSection();
  const block = createCustomBlock();
  section.appendChild(block);
  editableNodes.push(block);
  registerEditable(block);
  block.contentEditable = "true";
  block.spellcheck = false;
  block.focus();
  saveCustomBlocks();
});

editReset.addEventListener("click", () => {
  const confirmed = window.confirm("确定要清除网页里保存过的文字修改吗？页面会恢复到文件里的默认文案。");
  if (!confirmed) return;
  localStorage.removeItem(editableStorageKey);
  localStorage.removeItem(editableSizeStorageKey);
  localStorage.removeItem(customBlocksStorageKey);
  window.location.reload();
});

document.addEventListener("pointerup", (event) => {
  const editable = event.target.closest("[data-editable]");
  if (!editable) return;
  saveEditableSize(editable);
  saveCustomBlocks();
});

if (localStorage.getItem(editModeKey) === "on") {
  setEditMode(true);
}

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
    if (body.classList.contains("editing")) return;

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
