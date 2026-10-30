# Jedi Missions — frontend architecture

This is the architecture note for the app. It is the same review as the Cursor canvas *Jedi Missions Architecture Review*: what the product is, how the frontend is layered, how data flows, and why a distributed **system design** is not required.

Jedi Missions is a single-user, in-browser todo SPA. It calls one public HTTP API and keeps all mission state in React memory. A full system design (capacity, HA, data stores, service topology, consistency) would describe a different product. This document is the application architecture.

## Product

On load the app fetches random people, planets, starships, and species from [SWAPI.py4e](https://swapi.py4e.com/api), fills string templates, and shows about ten missions at padawan / knight / master difficulty. The user can complete, abandon, or add a custom mission. Header rank and the lightsaber bar are derived from completion percentage. Refreshing the page wipes state.

The npm package name is `jedi-missions`. The app is Create React App + React 19 + TypeScript. There is no backend, database, auth, or client-side router of our own.

## Runtime shape

| Metric | Value |
| --- | --- |
| Deployable units | 1 (CRA static SPA) |
| Backends / databases we operate | 0 |
| External APIs | 1 (`https://swapi.py4e.com/api`) |
| App TS/TSX modules | ~17 |

The only network hop is SWAPI. Everything else runs in the browser tab.

```
Browser (SPA)
    → App + ErrorBoundary
        → TodoContext (useReducer)
        → useSwapi
            → SwapiClient + 1-hour in-memory cache
                → SWAPI.py4e
            → taskGenerator
                → TodoContext
                    → UI (list, form, progress)
```

## Layers

| Layer | Files | Responsibility |
| --- | --- | --- |
| Shell | `src/index.tsx`, `src/App.tsx`, `src/components/ErrorBoundary.tsx` | Mount, StrictMode, catch render failures |
| Presentation | `AppLayout`, `TodoList`, `TodoItem`, `AddTodo`, `Loading`, `StarField` | Theme, mission list, custom form, progress chrome |
| App state | `src/context/TodoContext.tsx`, `src/types/app.ts` | Todos, loading, error, SWAPI name bags; derived stats |
| Integration | `src/hooks/useSwapi.ts`, `src/utils/swapiClient.ts`, `src/types/swapi.ts` | Parallel random fetches, axios, cache |
| Domain (client) | `src/utils/taskTemplates.ts`, `src/utils/taskGenerator.ts` | 25 templates, 40/40/20 difficulty mix, offline fallbacks |

### State

`TodoProvider` holds `AppState`: `todos`, `isLoading`, `error`, `swapiData`. Mutations go through a reducer (`ADD_TODO`, `TOGGLE_TODO`, `DELETE_TODO`, `SET_TODOS`, `SET_LOADING`, `SET_ERROR`, `SET_SWAPI_DATA`). Derived values (completed vs incomplete, counts by difficulty, completion percentage) live on the context value.

`useSwapi` keeps a **second** loading/error/data bag used only for fetching. `App.tsx` copies that into context and generates todos.

### SWAPI client

`SwapiClient` is a static wrapper around axios (`timeout: 10000`). Responses are stored in a module-level `Map` for one hour. `getRandomItems` loads page 1 for `count`, then GETs random resource IDs in parallel with `Promise.allSettled`. `useSwapi.fetchRandomData` requests five items from each of people, planets, starships, and species, then keeps **names only** as `TemplateData`.

### Mission generation

`TASK_TEMPLATES` are strings with `{character}`, `{planet}`, `{starship}`, `{species}` placeholders and a `requiredData` list. Balanced generation targets ~40% padawan, ~40% knight, ~20% master. If SWAPI fails, `generateFallbackTasks` uses templates with empty `requiredData`. Custom missions go through `generateCustomTask` from `AddTodo`.

## Does this need a system design?

No. System design is for products with independent parts you operate and must choose before you build: services, stores, traffic, failure domains, consistency.

| Design trigger | This project | System design needed? |
| --- | --- | --- |
| Multiple services you operate | None. CRA static bundle only. | No |
| Data you must store | React memory. Lost on refresh. | No |
| Users, auth, tenancy | Single anonymous browser tab. | No |
| Scale / capacity | One user, on the order of ~20 HTTP GETs per generate. | No |
| External dependency | SWAPI.py4e; 10s timeout; random IDs can 404. | A note, not a design doc |
| Consistency / sync | No shared state across devices. | No |
| Failure handling | ErrorBoundary + fallback templates + cache. | Client patterns only |

Worth writing down: this document (component tree, where state lives, generation, SWAPI contract, cache TTL, offline fallback).

Overkill: load balancers, API gateways, replicas, message buses, Kubernetes, CQRS, or C4 diagrams of backends that do not exist in this repo.

A system design **would** be required if missions were persisted per user, shared, or served through an API we own in front of SWAPI. Then the design would cover auth, a store, that API, and how to cache or degrade when SWAPI is down.

## Known frontend issues

These are application-architecture nits, not scale problems:

- **Two loading/error sources.** `useSwapi` and `TodoContext`, plus four `useEffect`s in `App.tsx`, can race during init, generate, fallback, and loading sync.
- **Error can hide the list.** `TodoList` returns error UI whenever `state.error` is set, even if fallback missions were already written.
- **Random IDs vs SWAPI pages.** Resource IDs are not a dense `1..count` range, so `getRandomItems` often 404s; `allSettled` drops those.
- **No persistence.** Correct for a demo; blocks any “save my missions” story.
- **Dead / weak helpers.** `useSwapiResource` is unused; `validateTemplateData` does not actually check the required data type.
- **Stale leftover docs/tests.** The original CRA “learn react” test and `codebase.md` snapshot may not match the current UI.

## Bottom line

Jedi Missions is a layered student SPA: types, a reducer, an API client, generation logic, and themed UI. That is **application design**. There is no system beyond one browser and one third-party REST API, so there is no system design to write until the product grows a backend, users, or stored data.
