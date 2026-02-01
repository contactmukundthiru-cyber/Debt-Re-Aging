# Marketing Site Deployment (GitHub Pages)

This guide covers optional improvements for the marketing site (`index.html` at repo root) when deployed to GitHub Pages or any static host.

## Required for GitHub Pages

1. **Enable Pages**: Repo **Settings → Pages** → Source = your branch (e.g. `main`), folder = **root** (or `/docs` if you use that).
2. **Base URL**: If your site is at `https://<user>.github.io/<repo>/`, set `baseurl` in `_config.yml` to match the repo name (e.g. `/Debt-Re-Aging` or `/debt-re-aging`). Leave empty if the site is at the root of a user/org Pages domain.
3. **App links**: By default, "Start Portal" links go to `pwa-app/out/` (same origin). To point them to your Vercel app, add in `index.html` `<head>`:
   ```html
   <meta name="app-url" content="https://your-app.vercel.app">
   ```

## Optional: SEO & Sharing

### Canonical URL

- In `index.html`, set `<link rel="canonical" href="https://your-full-site-url/">` to your production URL.
- If left empty, the page sets it from the current location (origin + pathname).

### Open Graph / Twitter (og:image)

- **og:image**: Add a share image (1200×630 px recommended). Put it in an `img/` folder (e.g. `img/og.png`) and set in `index.html`:
  ```html
  <meta property="og:image" content="https://contactmukundthiru-cyber.github.io/Debt-Re-Aging/img/og.png">
  <meta name="twitter:image" content="https://contactmukundthiru-cyber.github.io/Debt-Re-Aging/img/og.png">
  ```
- Use an **absolute URL**; social crawlers need a full URL.
- **og:url**: Set `<meta property="og:url" content="https://contactmukundthiru-cyber.github.io/Debt-Re-Aging/">` (or your production URL) if you want a fixed value; otherwise the page sets it from the current URL.

### Structured Data (JSON-LD)

- The page includes basic **WebApplication** and **Organization** schema. Edit the `<script type="application/ld+json">` block in `index.html` to match your org name and URL.

## Optional: Analytics

- Add your analytics script in `index.html` (e.g. Plausible, Fathom, or Google Analytics) and set your site/measurement ID.
- Prefer **defer** or **async** and avoid blocking render.

## Optional: 404 Page

- `404.html` is a simple “Page not found” with links to Home and Open App. GitHub Pages will serve it for unknown paths if the file is in the published root.

## Checklist

- [ ] GitHub Pages enabled, branch/folder set
- [ ] `_config.yml` `baseurl` matches repo URL
- [ ] `app-url` meta set if using Vercel for the PWA
- [ ] Canonical and og:url set (or leave empty for auto)
- [ ] og:image and twitter:image set to full URL of share image
- [ ] Analytics added if desired (uncomment and configure)
- [ ] JSON-LD org/URL updated in `index.html`
