# Gold Fundamentals News

A daily gold-market news site: HTML5 + CSS3 + Bootstrap 5 + vanilla JS frontend, backed by an Express server with a local JSON file database.

## Run locally

```bash
npm install
npm start
```

Then open http://localhost:3000

## Admin key

Publishing, editing, and deleting is protected by an admin key.

- Default key: `goldfundamentals2026`
- Change it by setting an environment variable before starting the server:
  ```bash
  ADMIN_KEY=your-new-key npm start
  ```
- On Render, set `ADMIN_KEY` under your service's Environment settings.

Go to `/admin.html`, enter the key once — it's saved in your browser so you won't need to re-enter it on that device.

## Adding today's articles

1. Open `/admin.html`
2. Fill in title, category, summary, and full content (separate paragraphs with a blank line)
3. Optionally paste an image URL and mark it "Featured" to put it in the homepage hero
4. Click **Publish article**

Articles save straight to `data/articles.json` — no external database needed.

## Project structure

```
gold-news/
├── server.js              Express app + JSON API + local file DB
├── data/articles.json     Your article database (safe to back up/version)
├── public/
│   ├── index.html         Homepage — hero, filters, article grid
│   ├── article.html       Full article view
│   ├── admin.html         Publishing dashboard (key-gated)
│   ├── css/style.css      Site theme
│   └── js/                Frontend logic (main.js, article.js, admin.js)
└── package.json
```

## API reference

| Method | Route                  | Auth  | Purpose                        |
|--------|-------------------------|-------|---------------------------------|
| GET    | `/api/articles`          | none  | List articles (supports `?category=`, `?search=`, `?featured=true`, `?limit=`) |
| GET    | `/api/articles/:id`      | none  | Get a single article           |
| GET    | `/api/categories`        | none  | List distinct categories       |
| POST   | `/api/articles`          | key   | Create an article              |
| PUT    | `/api/articles/:id`      | key   | Update an article               |
| DELETE | `/api/articles/:id`      | key   | Delete an article               |

Authenticated requests need header: `x-admin-key: <your key>`

## Deploying

Works as-is on Render (Node web service, build command `npm install`, start command `npm start`). Note: on Render's free tier the filesystem is ephemeral on redeploy — `data/articles.json` will reset unless you attach a persistent disk. For a fully durable setup later, this JSON file can be swapped for a real database with minimal changes to `server.js`.
