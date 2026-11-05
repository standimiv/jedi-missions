# Jedi Missions — frontend architecture

This document describes what the app is, how the frontend is layered, and how data flows at runtime.

Jedi Missions is a single-user, in-browser mission list. It calls one public HTTP API and keeps missions, a completion journal, and custom templates in `localStorage`.

## Product

On a first visit the app fetches random people, planets, starships, and species from [SWAPI.py4e](https://swapi.py4e.com/api), fills string templates, and shows about ten missions at padawan / knight / master difficulty. The user can complete, abandon, add a custom mission, or save that mission as a reusable template. Header rank and the lightsaber bar are derived from completion percentage. A later visit restores the saved list and does not call SWAPI until New Missions or Retry SWAPI.

The npm package name is `jedi-missions`. The app is Create React App + React 19 + TypeScript. There is no backend, database, auth, or client-side router of our own.

## Runtime shape

| Metric | Value |
| --- | --- |
| Deployable units | 1 (CRA static SPA) |
| Backends / databases we operate | 0 |
| External APIs | 1 (`https://swapi.py4e.com/api`) |
| App TS/TSX modules | ~19 |

The only network hop is SWAPI. Everything else runs in the browser tab.

```
Browser (SPA)
    → App + ErrorBoundary
        → TodoContext (useReducer)
            → localStorage (missions, journal, templates)
        → useSwapi  (skipped on load when missions are already saved)
            → SwapiClient + 1-hour in-memory cache
                → SWAPI.py4e
            → taskGenerator
                → TodoContext
                    → UI (list, filters, form, journal, progress)
```

## Layers

| Layer | Files | Responsibility |
| --- | --- | --- |
| Shell | `src/index.tsx`, `src/App.tsx`, `src/components/ErrorBoundary.tsx` | Mount, StrictMode, catch render failures |
| Presentation | `AppLayout`, `TodoList`, `TodoItem`, `AddTodo`, `Loading`, `StarField` | Theme, mission list, custom form, progress chrome |
| App state | `src/context/TodoContext.tsx`, `src/types/app.ts` | Todos, journal, templates, loading, error, SWAPI name bags; derived stats |
| Browser storage | `src/utils/storage.ts` | One `localStorage` key; revives `createdAt` |
| Integration | `src/hooks/useSwapi.ts`, `src/utils/swapiClient.ts`, `src/types/swapi.ts` | Parallel random fetches, axios, cache |
| Domain (client) | `src/utils/taskTemplates.ts`, `src/utils/taskGenerator.ts` | 31 templates, 40/40/20 difficulty mix, offline fallbacks |

### State

`TodoProvider` holds `AppState`: `todos`, `journal`, `templates`, `isLoading`, `error`, `swapiData`. Mutations go through a reducer (`ADD_TODO`, `TOGGLE_TODO`, `DELETE_TODO`, `SET_TODOS`, `SET_LOADING`, `SET_ERROR`, `SET_SWAPI_DATA`, `ADD_TEMPLATE`, `DELETE_TEMPLATE`). Completing a mission appends one journal line. Reopening does not. Derived values (completed vs incomplete, counts by difficulty, completion percentage) live on the context value. Search, difficulty, and status filters stay in `TodoList`; they do not change stored missions.

`useSwapi` holds fetch-specific loading, error, and raw name lists. `fetchRandomData` returns those names, or `null` when the request fails or no names are usable. `App.tsx` calls that on mount only when no missions are saved, and again from New Missions or Retry SWAPI, then writes generated missions into context. A failed refresh keeps the current list and shows the notice. Deleting every mission does not fetch again until the next empty load.

### SWAPI client

`SwapiClient` is a static wrapper around axios (`timeout: 10000`). Responses are stored in a module-level `Map` for one hour. `getRandomItems` loads paginated list results (page 1 plus up to two extra random pages), shuffles the pool, and returns up to the requested count—avoiding invalid resource IDs. `useSwapi.fetchRandomData` requests five items from each of people, planets, starships, and species, then keeps **names only** as `TemplateData`. It returns `null` when nothing usable came back.

### Mission generation

`TASK_TEMPLATES` are strings with `{character}`, `{planet}`, `{starship}`, `{species}` placeholders and a `requiredData` list. Balanced generation targets ~40% padawan, ~40% knight, ~20% master. Each placeholder in a template is filled with a random name from the matching SWAPI list. If SWAPI fails or returns no usable names on the first load, `fetchRandomData` returns `null` and `generateFallbackTasks` supplies the eight offline templates (no placeholders). A later failure leaves the missions already on screen. If none are left, that same failure fills the offline set. Custom missions go through `generateCustomTask` from `AddTodo`. Template eligibility is enforced in `taskGenerator` via `hasRequiredData`.

## Browser storage

One key, `jedi-missions-v1`, holds missions, the journal (last 40 completions), and up to 20 custom templates. `createdAt` is stored as JSON and turned back into a `Date` on load. Corrupt JSON is ignored and treated as an empty store, which then follows the normal first-visit fetch. Saving is skipped if `localStorage` throws. The SWAPI name cache stays in memory and is separate from this key.

A production build registers `public/sw.js`, which caches same-origin assets for an offline shell. It does not cache SWAPI. Mission text still comes from storage or the offline templates.

## Failure handling

- **ErrorBoundary** catches render errors and offers reload / retry.
- **SWAPI errors** on the first load use offline fallback missions. A failed New Missions leaves the current list in place, or fills the offline set when that list is empty.
- **Non-blocking notices:** when missions exist but SWAPI was unavailable, `state.error` carries a short notice while `TodoList` still renders the list (full-screen error UI only when there are zero missions).
- **Status banner** in `App.tsx` repeats the same message below Mission Control and offers **Retry SWAPI** without a full reload. A successful generation of fewer than ten missions shows a separate notice.

## Intentional limitations

These are product choices, not bugs:

- **This browser only** — missions, journal, and templates are local. Another browser or a cleared site storage starts empty and fetches again.
- **Dual loading flags** — `useSwapi` tracks the SWAPI request; `TodoContext` starts loading and `App` clears it when generation or fallback finishes. The hook flag is not copied into context.
- **External API** — availability and rate limits depend on SWAPI.py4e; the in-memory cache reduces repeat traffic within a session.
- **Dev dependencies** — remaining `npm audit` findings are mostly in Create React App’s build/test toolchain (not the production bundle); safe fixes are applied where possible (e.g. `underscore` override); the rest need a CRA migration to remove.

## Summary

Jedi Missions is a layered React SPA: typed state, a reducer, local persistence, an API client, template-based generation, and themed UI. All behavior runs in the browser against SWAPI for names at generation time.
