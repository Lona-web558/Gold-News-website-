const API = "/api/articles";
const STORAGE_KEY = "gf_admin_key";

const gate = document.getElementById("gate");
const adminContent = document.getElementById("adminContent");
const gateError = document.getElementById("gateError");
const logoutBtn = document.getElementById("logoutBtn");

function getKey() {
  return localStorage.getItem(STORAGE_KEY) || "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

async function tryUnlock(key) {
  // Validate the key by attempting a harmless authenticated request.
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": key },
    body: JSON.stringify({}), // intentionally incomplete -> expect 400, not 401, if key is valid
  });
  return res.status !== 401;
}

document.getElementById("unlockBtn").addEventListener("click", async () => {
  const key = document.getElementById("adminKeyInput").value.trim();
  if (!key) return;
  gateError.textContent = "Checking…";
  const valid = await tryUnlock(key);
  if (valid) {
    localStorage.setItem(STORAGE_KEY, key);
    showAdmin();
  } else {
    gateError.textContent = "Invalid key. Try again.";
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

function showAdmin() {
  gate.classList.add("d-none");
  adminContent.classList.remove("d-none");
  logoutBtn.classList.remove("d-none");
  loadList();
}

// ---------- Form handling ----------
const form = document.getElementById("articleForm");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formStatus = document.getElementById("formStatus");

function resetForm() {
  form.reset();
  document.getElementById("articleId").value = "";
  document.getElementById("author").value = "Lona Smith";
  submitBtn.textContent = "Publish article";
  cancelEditBtn.classList.add("d-none");
}

cancelEditBtn.addEventListener("click", resetForm);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("articleId").value;
  const payload = {
    title: document.getElementById("title").value.trim(),
    category: document.getElementById("category").value,
    summary: document.getElementById("summary").value.trim(),
    content: document.getElementById("content").value.trim(),
    imageUrl: document.getElementById("imageUrl").value.trim(),
    author: document.getElementById("author").value.trim() || "Lona Smith",
    featured: document.getElementById("featured").checked,
  };

  const url = id ? `${API}/${id}` : API;
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "x-admin-key": getKey() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      formStatus.textContent = `Error: ${err.error || res.statusText}`;
      formStatus.style.color = "#e05c5c";
      return;
    }
    formStatus.textContent = id ? "Article updated." : "Article published.";
    formStatus.style.color = "#2dd4d4";
    resetForm();
    loadList();
  } catch (err) {
    formStatus.textContent = "Network error — is the server running?";
    formStatus.style.color = "#e05c5c";
  }
});

function editArticle(a) {
  document.getElementById("articleId").value = a.id;
  document.getElementById("title").value = a.title;
  document.getElementById("category").value = a.category;
  document.getElementById("summary").value = a.summary;
  document.getElementById("content").value = a.content;
  document.getElementById("imageUrl").value = a.imageUrl || "";
  document.getElementById("author").value = a.author;
  document.getElementById("featured").checked = a.featured;
  submitBtn.textContent = "Save changes";
  cancelEditBtn.classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteArticle(id) {
  if (!confirm("Delete this article? This cannot be undone.")) return;
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: { "x-admin-key": getKey() },
  });
  if (res.ok) {
    loadList();
  } else {
    alert("Failed to delete article.");
  }
}

async function loadList() {
  const listEl = document.getElementById("adminList");
  listEl.innerHTML = `<div class="state-panel">Loading…</div>`;
  try {
    const res = await fetch(API);
    const data = await res.json();
    if (data.articles.length === 0) {
      listEl.innerHTML = `<div class="state-panel">No articles yet. Publish your first one above.</div>`;
      return;
    }
    listEl.innerHTML = data.articles
      .map(
        (a) => `
      <div class="admin-row">
        <div class="flex-grow-1">
          <span class="tag-bracket">${escapeHtml(a.category)}</span>
          ${a.featured ? '<span class="tag-bracket" style="color:var(--cyan);">FEATURED</span>' : ""}
          <div style="font-weight:600;">${escapeHtml(a.title)}</div>
          <div class="text-muted" style="font-size:0.8rem; font-family: var(--font-mono);">${formatDate(a.createdAt)}</div>
        </div>
        <button class="btn-outline-gf" style="border-color:var(--border); color:var(--text);" onclick='editArticle(${JSON.stringify(a).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn-outline-gf" onclick="deleteArticle(${a.id})">Delete</button>
      </div>`
      )
      .join("");
  } catch (e) {
    listEl.innerHTML = `<div class="state-panel">Failed to load articles.</div>`;
  }
}

// Auto-unlock if a key is already stored
(async function init() {
  const key = getKey();
  if (key) {
    const valid = await tryUnlock(key);
    if (valid) {
      showAdmin();
      return;
    }
  }
  gate.classList.remove("d-none");
})();
