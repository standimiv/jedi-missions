# Jedi Missions

A single-player Star Wars mission list. On a first visit it asks [SWAPI.py4e](https://swapi.py4e.com/api) for names, fills mission templates, and shows about ten missions at padawan, knight, and master difficulty. Complete them, abandon them, or write your own. Rank and the lightsaber bar follow your completion rate.

Missions, the completion journal, saved custom templates, and the last SWAPI names stay in this browser (`localStorage`). A refresh keeps them. **New Missions** asks before it replaces the list. If SWAPI is down and names were saved before, it builds missions from those names. With nothing saved, eight offline templates are used instead. You can edit a custom mission, undo an abandon for a few seconds, and export or import the save file.

Live site: [https://standimiv.github.io/jedi-missions](https://standimiv.github.io/jedi-missions)

How the pieces fit: **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

## Scripts

```bash
npm start      # dev server at http://localhost:3000
npm test       # Jest
npm run build  # static production bundle in build/
npm run deploy # publish build/ to GitHub Pages
```

## Deploy

`npm run deploy` builds the app and publishes `build/` to the `gh-pages` branch. GitHub Pages should serve that branch at the homepage URL above.
