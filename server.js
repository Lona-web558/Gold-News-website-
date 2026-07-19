const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "articles.json");

// Simple admin key so only you can publish/edit/delete articles.
// Override in production by setting the ADMIN_KEY environment variable.
const ADMIN_KEY = process.env.ADMIN_KEY || "goldfundamentals2026";

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname)));

// ---------- tiny local JSON "database" helpers ----------
function readDB() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function requireAdmin(req, res, next) {
  const key = req.header("x-admin-key");
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized. Missing or invalid admin key." });
  }
  next();
}

// ---------- API routes ----------

// GET /api/articles?category=Markets&search=fed&limit=10
app.get("/api/articles", (req, res) => {
  const db = readDB();
  let results = [...db.articles];

  const { category, search, featured } = req.query;

  if (category && category !== "All") {
    results = results.filter(
      (a) => a.category.toLowerCase() === String(category).toLowerCase()
    );
  }

  if (featured === "true") {
    results = results.filter((a) => a.featured === true);
  }

  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
    );
  }

  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const limit = parseInt(req.query.limit, 10);
  if (!isNaN(limit)) {
    results = results.slice(0, limit);
  }

  res.json({ count: results.length, articles: results });
});

// GET /api/categories - distinct category list
app.get("/api/categories", (req, res) => {
  const db = readDB();
  const categories = [...new Set(db.articles.map((a) => a.category))].sort();
  res.json({ categories });
});

// GET /api/articles/:id
app.get("/api/articles/:id", (req, res) => {
  const db = readDB();
  const article = db.articles.find((a) => a.id === Number(req.params.id));
  if (!article) return res.status(404).json({ error: "Article not found." });
  res.json(article);
});

// POST /api/articles (admin only) - create a new article
app.post("/api/articles", requireAdmin, (req, res) => {
  const { title, category, summary, content, author, imageUrl, featured } = req.body;

  if (!title || !category || !summary || !content) {
    return res.status(400).json({
      error: "title, category, summary, and content are required.",
    });
  }

  const db = readDB();
  const now = new Date().toISOString();

  const newArticle = {
    id: db.nextId,
    title,
    category,
    summary,
    content,
    author: author || "Lona Smith",
    imageUrl: imageUrl || "",
    featured: Boolean(featured),
    createdAt: now,
    updatedAt: now,
  };

  db.articles.push(newArticle);
  db.nextId += 1;
  writeDB(db);

  res.status(201).json(newArticle);
});

// PUT /api/articles/:id (admin only) - update an article
app.put("/api/articles/:id", requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.articles.findIndex((a) => a.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Article not found." });

  const allowed = ["title", "category", "summary", "content", "author", "imageUrl", "featured"];
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      db.articles[idx][field] = req.body[field];
    }
  }
  db.articles[idx].updatedAt = new Date().toISOString();

  writeDB(db);
  res.json(db.articles[idx]);
});

// DELETE /api/articles/:id (admin only)
app.delete("/api/articles/:id", requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.articles.findIndex((a) => a.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Article not found." });

  const removed = db.articles.splice(idx, 1);
  writeDB(db);
  res.json({ deleted: removed[0] });
});

// Fallback: serve index.html for any unmatched non-API route (simple SPA-friendly routing)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Gold Fundamentals News running at http://localhost:${PORT}`);
  console.log(`Admin key: ${ADMIN_KEY} (set ADMIN_KEY env var to change it)`);
});
