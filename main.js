const API = "/api/articles";
const CATS_API = "/api/categories";

let allArticles = [];
let activeCategory = "All";
let searchTerm = "";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadCategories() {
  try {
    const res = await fetch(CATS_API);
    const data = await res.json();
    const wrap = document.getElementById("categoryChips");
    data.categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "filter-chip";
      btn.dataset.category = cat;
      btn.textContent = cat;
      btn.addEventListener("click", () => setActiveCategory(cat));
      wrap.appendChild(btn);
    });
  } catch (e) {
    console.error("Failed to load categories", e);
  }
}

function setActiveCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.category === cat);
  });
  render();
}

function renderHero(article) {
  if (!article) return;
  document.getElementById("heroTitle").textContent = article.title;
  document.getElementById("heroSummary").textContent = article.summary;
  document.getElementById("heroMeta").innerHTML =
    `<span class="tag-bracket">${escapeHtml(article.category)}</span> &nbsp; ${escapeHtml(article.author)} &middot; ${formatDate(article.createdAt)}`;
  const heroSection = document.querySelector(".hero");
  heroSection.style.cursor = "pointer";
  heroSection.onclick = () => { window.location.href = `article.html?id=${article.id}`; };
}

function renderGrid(articles) {
  const grid = document.getElementById("articleGrid");
  const empty = document.getElementById("emptyState");
  grid.innerHTML = "";

  if (articles.length === 0) {
    empty.classList.remove("d-none");
    return;
  }
  empty.classList.add("d-none");

  articles.forEach((a) => {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4";
    col.innerHTML = `
      <a href="article.html?id=${a.id}" class="article-card d-block text-decoration-none">
        ${a.imageUrl ? `<img src="${escapeHtml(a.imageUrl)}" class="article-card-img" alt="">` : ""}
        <div class="article-card-body">
          <span class="tag-bracket">${escapeHtml(a.category)}</span>
          <h3 class="article-card-title">${escapeHtml(a.title)}</h3>
          <p class="article-card-summary">${escapeHtml(a.summary)}</p>
          <div class="article-card-footer">
            <span>${escapeHtml(a.author)}</span>
            <span>${timeAgo(a.createdAt)}</span>
          </div>
        </div>
      </a>`;
    grid.appendChild(col);
  });
}

function render() {
  let list = [...allArticles];
  if (activeCategory !== "All") {
    list = list.filter((a) => a.category === activeCategory);
  }
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    list = list.filter(
      (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
    );
  }
  renderGrid(list);
}

async function loadArticles() {
  try {
    const res = await fetch(API);
    const data = await res.json();
    allArticles = data.articles;

    const featured = allArticles.find((a) => a.featured) || allArticles[0];
    renderHero(featured);
    render();
  } catch (e) {
    document.getElementById("heroTitle").textContent = "Unable to load articles";
    document.getElementById("emptyState").classList.remove("d-none");
    console.error(e);
  }
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  searchTerm = e.target.value;
  render();
});

document.querySelector('[data-category="All"]').addEventListener("click", () => setActiveCategory("All"));

loadCategories();
loadArticles();
