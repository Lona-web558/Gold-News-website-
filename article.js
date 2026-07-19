function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

async function loadArticle() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const container = document.getElementById("articleContainer");

  if (!id) {
    container.innerHTML = `<div class="state-panel">No article specified.</div>`;
    return;
  }

  try {
    const res = await fetch(`/api/articles/${id}`);
    if (!res.ok) throw new Error("not found");
    const a = await res.json();

    document.title = `${a.title} — Gold Fundamentals News`;

    const paragraphs = a.content
      .split(/\n\s*\n/)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
      .join("");

    container.innerHTML = `
      <span class="tag-bracket">${escapeHtml(a.category)}</span>
      <h1 class="hero-title" style="margin-top:0.75rem;">${escapeHtml(a.title)}</h1>
      <div class="hero-meta mb-4">${escapeHtml(a.author)} &middot; ${formatDate(a.createdAt)}</div>
      ${a.imageUrl ? `<img src="${escapeHtml(a.imageUrl)}" class="article-detail-img" alt="">` : ""}
      <div class="article-detail-body">${paragraphs}</div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="state-panel">Article not found. <a href="index.html">Return home</a>.</div>`;
  }
}

loadArticle();
