# Node It — Roadmap

A living plan for where Node It is headed. Items are grouped into phases by
priority, not time. Check things off as they land; demote anything that turns
out to be out of scope.

Legend: `[x]` done · `[ ]` pending · `[~]` partial / in progress

---

## Phase 0 — Foundations (done)

- [x] Monorepo scaffold: `backend/`, `frontend/`, `caddy/`, `database/`
- [x] Dockerized dev stack (mongo + backend + frontend + caddy) with hot reload
- [x] Red & white brand identity, minimalist design direction
- [x] MVC backend layout (models / controllers / services / routes / validators)
- [x] Zod request validation middleware
- [x] Central error handler with CastError / ValidationError / duplicate-key translation
- [x] `GET /api/health` with live Mongo connection state

## Phase 1 — Data layer (done)

- [x] `Category` model with typed fields + `identityKeys` + `aggregate` strategy
- [x] `Node` model with `parentId`, denormalized `ancestors[]`, `order`, `values`
- [x] Merge-on-duplicate via SHA-1 `identityHash` + partial unique index
- [x] `moveNode` service — aggregation-pipeline cascade for descendants' ancestors
- [x] `loadSubtree` — single indexed query (no `$graphLookup`)
- [x] `deleteSubtree` — hard delete, one query
- [x] `aggregateSubtree` — sum / avg / count per category field config
- [x] Reorder endpoint with gap-spacing so single drags stay O(1)
- [x] 60 tests: unit + integration, in-memory mongo, all green

## Phase 2 — Frontend MVP (done)

- [x] React Router shell: `/`, `/categories`, `/categories/:id`
- [x] Axios API client covering every endpoint + merge-on-duplicate aware create
- [x] Category management screen
  - [x] Create / edit / delete categories (with cascade prompt on 409)
  - [x] Field editor (add/remove fields, pick type, toggle aggregate, pick identity keys)
- [x] Explorer view — tree of nodes for a category
  - [x] Collapse/expand branches
  - [x] Inline create (child or sibling via drop-as-sibling)
  - [x] Inline edit of `values`
  - [x] Delete with subtree-count confirmation
- [x] Aggregate summary strip on selected subtree root
- [x] Drag-and-drop reordering (wired to `POST /api/nodes/reorder`)
- [x] Drag-and-drop reparenting (wired to `PATCH /api/nodes/:id` with new `parentId`)
- [x] Toasts for merge-on-duplicate ("merged into existing Apples") and 409s
- [x] Loading / empty / error states per view
- [x] Keyboard navigation in the tree (arrows, enter, shift-enter, del, esc)

## Phase 2.5 — Next.js migration

Move the Vite + React Router frontend onto Next.js (App Router) and fold the
Express API into Next route handlers. Goal: server-rendered first paint for
the canvas/tree, one runtime instead of two, and a cleaner deploy story.

- [ ] Scaffold Next.js app at `web/` (App Router, JS to match the rest of the repo)
- [ ] Dockerfile.dev for the web service (mirrors `frontend/`)
- [ ] Wire `web` into `docker-compose.yml` alongside existing `frontend`
- [ ] Port shared design tokens (`tokens.css`) and base styles into `web/app/globals.css`
- [ ] Move axios API client from `frontend/src/services/api.js` to `web/lib/api.js`
- [ ] Port pages: `/` (Home), `/categories`, `/categories/:id`
  - [ ] Server component shells with `'use client'` boundaries for interactive bits
- [ ] Port components: `Layout`, `Toasts`, `category/*`, `tree/*`
- [ ] Move backend logic into `web/app/api/` route handlers
  - [ ] `app/api/health/route.js`
  - [ ] `app/api/categories/[...]/route.js`
  - [ ] `app/api/nodes/[...]/route.js`
  - [ ] Mongoose connection helper for Next runtime (cached across hot reloads)
- [ ] Port backend tests to run against route handlers (or keep services pure and re-use them)
- [ ] Flip Caddy: route `/` to the new `web` service, retire the `backend` and old `frontend` services
- [ ] Delete `frontend/` and `backend/` once parity is reached

## Phase 3 — Redesign, Polish & UX

- [ ] Redesign the layouts
  - [ ] Change the identifier marker to a selection field in the category settings
  - [ ] Implement Canvas view
    - [ ] Categories will be displayed as dots
	- [ ] Right clicking a dot will select it
	  - [ ] Selection options will be a bar at the bottom of the canvas board
	- [ ] Nodes connected to other nodes will be displayed
  - [ ] To edit a category, right click on the category in the category viewer and it will open a popup field to edit the category settings
    - [ ] Additionally the popup can be opened by selection in the canvas viewer
  - [ ] Move category viewer to left side and polish UI/UX
    - [ ] Left-click will open a categories contents and show the values
- [ ] Enable Full-control with keyboard -> More efficient for users
  - [ ] Keyboard controls in canvas view
- [ ] Search within a category (indexed text fields)
- [ ] Sort options beyond `order` (by any field, asc/desc)
- [ ] Breadcrumbs from `ancestors[]`
- [ ] Filter bar per field type (range for number/currency/date, contains for text)
- [ ] Undo last destructive op (soft queue, N seconds)
- [ ] Dark mode + theme persistence
- [ ] Mobile/touch-friendly tree gestures
- [ ] Accessibility pass (focus rings, ARIA tree, reduced motion)

## Phase 4 — Backend hardening

- [ ] Pagination on `GET /api/nodes` (`?limit=&cursor=`)
- [ ] Partial update of `values` (deep-merge) vs. the current whole-object replace
- [ ] Server-sent events or websockets for real-time subtree updates
- [ ] Structured logging (pino) with request IDs
- [ ] Rate limiting on write endpoints
- [ ] OpenAPI / Swagger doc generated from zod schemas
- [ ] Health endpoint: add version, uptime, index-ready flag
- [ ] Fix Mongoose deprecation: swap `new: true` → `returnDocument: 'after'`
- [ ] Performance test: 100k-node tree, subtree + aggregate latency targets

## Phase 5 — Auth & multi-tenancy

- [ ] User model + email/password auth (bcrypt)
- [ ] Implement OAuth 2.0
- [ ] JWT session middleware
- [ ] `ownerId` on categories; scope all queries by owner
- [ ] Shareable read-only links (signed URL) per subtree
- [ ] Invite / collaborator roles (viewer / editor)
- [ ] Audit log of mutations (who changed what, when)

## Phase 6 — Import / export & integrations

- [ ] JSON export of a category (definition + all nodes)
- [ ] JSON import with ID remapping
- [ ] CSV import into a category (one row per node, header → field mapping)
- [ ] Markdown/plain-text export of a subtree (for notes-style categories)
- [ ] Backup job: mongodump on a schedule, retained N days

## Phase 7 — Advanced features

- [ ] File attachments on nodes (S3/MinIO backing store)
- [ ] Rich-text field type
- [ ] Tag field type with autocomplete
- [ ] Cross-category links (a node references another node)
- [ ] Saved views (filter + sort + column config) per category
- [ ] Plugin hooks: pre-save / post-save for custom field validation or derived values
- [ ] Mobile client (React Native)
  - [ ] IOS support
  - [ ] Android support
- [ ] Co-working on canvas (Websockets)
- [ ] PoS system
  - [ ] PoS mode-view
    - [ ] Payment handling
	- [ ] Quick inventory management
  - [ ] Integration with payment hardware
- [ ] Software client

## Phase 8 — Ops & release

- [ ] CI pipeline: lint + test on PRs (GitHub Actions)
- [ ] Production Dockerfiles (multi-stage, non-root, no nodemon)
- [ ] `docker-compose.prod.yml` with managed mongo + TLS via caddy
- [ ] Staging deploy + smoke-test workflow
- [ ] Release notes + semver tagging

---

## Design principles (don't drop these)

- **Efficient first, but never at the cost of readability.** Denormalized ancestors,
  partial unique indexes, and pipeline updates exist because they keep UX snappy,
  not because they're clever.
- **Schema-driven UI.** The frontend renders category fields generically; adding
  a new field type should be a backend-only change (except for the renderer).
- **Every mutation has a 1-query happy path.** `moveNode`, `deleteSubtree`,
  `reorderNodes`, merge-on-duplicate — all use a single round-trip.
- **Tests are the spec.** If a behavior matters, it has a test. PRs that change
  behavior update or add tests.

## How to contribute to this roadmap

Open a PR editing this file. Add to the phase that fits, or propose a new phase.
Keep items small enough that "done" is obvious.
