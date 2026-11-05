# Jedi Missions

A single-player Star Wars mission list. On a first visit it asks [SWAPI.py4e](https://swapi.py4e.com/api) for names, fills mission templates, and shows about ten missions at padawan, knight, and master difficulty. Complete them, abandon them, or write your own. Rank and the lightsaber bar follow your completion rate.

Missions, the completion journal, and saved custom templates stay in this browser (`localStorage`). A refresh keeps them. If SWAPI is down on an empty list, eight offline templates are used instead, and **Retry SWAPI** tries again without reloading the page. “New Missions” still replaces the current list.

How the pieces fit: **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

## Scripts

```bash
npm start     # dev server at http://localhost:3000
npm test      # Jest
npm run build # static production bundle in build/
```

## Deploy

The production build is a static site. Netlify, Vercel, or any static host can publish `build/`.

For GitHub Pages, set `"homepage"` in `package.json` to `https://<user>.github.io/<repo>` before building so asset paths match the project site. This repo leaves `homepage` unset so a root host keeps working.
