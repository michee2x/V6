# AGENT INSTRUCTIONS — Read Before Writing Any Code

This file is the single source of truth for how this app is built. Every agent
(human or AI) working in this repo must read this file before generating
architecture, UI, or API code, and must re-check it whenever a decision feels
ambiguous. If something here conflicts with a one-off instruction in a prompt,
this file wins unless the user explicitly overrides it for that task.

The goal: an app that does not "feel AI-generated." That means no
inconsistent spacing, no five different button styles, no silent loading
states, no raw `alert()` calls, no guessing at error copy, no components
invented when a proven one already exists. Consistency and restraint are the
product here as much as any feature is.

---

## 0. Non-Negotiables (read this twice)

1. **Never hardcode a UI primitive that shadcn/ui already provides.** Buttons,
   inputs, selects, dialogs, dropdowns, toasts, tooltips, tabs, accordions,
   cards, badges, skeletons, avatars, progress bars, sheets, popovers,
   command palettes — all come from shadcn/ui. If you catch yourself writing
   `<button className="...">` from scratch, stop and use `<Button>`.
2. **Never leave a loading state silent.** Every async boundary (page load,
   route transition, mutation, fetch) has a visible, intentional loading
   state — skeleton, spinner, or progress indicator. "It just works
   eventually" is a bug, not a feature.
3. **Every API error follows the global error envelope** (Section 5). The
   frontend never parses ad-hoc error shapes per-endpoint.
4. **Text styling comes from the typographic scale** (Section 2), never
   inline `text-[15px]` or one-off `font-` combinations.
5. **Every decision should be explainable.** If an agent picks a pattern, it
   should be able to say why, referencing a section below. "It compiled" is
   not a justification.

---

## 1. Tech Stack & Architecture

- **Framework:** Next.js (App Router), TypeScript strict mode.
- **UI Kit:** shadcn/ui on top of Radix primitives + Tailwind CSS.
- **State:** Server state via React Query (TanStack Query) or RSC fetching —
  never hand-rolled `useEffect` + `useState` fetch chains. Client-only UI
  state via `useState`/`useReducer`, or Zustand if state needs to be shared
  across distant components.
- **Forms:** `react-hook-form` + `zod` for schema validation, wired through
  shadcn's `<Form>` components. Validation rules live in a shared `schemas/`
  folder so frontend and backend validate against the same shape.
- **API layer:** REST with a consistent envelope (Section 4), or tRPC if the
  whole stack is TypeScript end-to-end — pick one per project and stay
  consistent; never mix.
- **Styling:** Tailwind utility classes only, driven by design tokens defined
  in `tailwind.config.ts` and CSS variables in `globals.css`. No inline
  `style={{}}` unless animating a dynamic value that Tailwind cannot express.

### Folder structure (App Router)

```
/app
  /(marketing)/...            # public pages, own layout
  /(app)/...                  # authenticated app shell, own layout
    /dashboard/page.tsx
    /settings/page.tsx
  /api/...                    # route handlers (if REST)
  layout.tsx
  loading.tsx                 # global fallback
  error.tsx                   # global error boundary
  not-found.tsx
/components
  /ui                         # shadcn primitives (generated, do not hand-edit heavily)
  /shared                     # composed, reusable, app-specific components
  /features/<feature-name>    # feature-scoped components, colocated
/lib
  /api                        # fetch clients, query hooks
  /schemas                    # zod schemas shared by forms + API
  /utils
/hooks
/styles
  globals.css
/types
```

**Rule:** a component that is used in exactly one place lives next to the
page that uses it. A component used in 2+ places moves to `/components/shared`.
Never build a "just in case" abstraction before the second usage exists.

---

## 2. Design System — Typography

Think of this as "shadcn for text." Define these as reusable classes/utilities
(e.g. a `text-h1`, `text-body`, `text-caption` set in `globals.css`, or a
`<Typography>` component with a `variant` prop) so no page ever invents its
own font size.

| Token       | Size / Line-height | Weight | Use for                                  |
|-------------|--------------------|--------|-------------------------------------------|
| `display`   | 48/56              | 700    | Marketing hero headlines only             |
| `h1`        | 32/40              | 700    | Page titles                               |
| `h2`        | 24/32              | 600    | Section headers                           |
| `h3`        | 20/28              | 600    | Card / subsection headers                 |
| `body-lg`   | 16/26              | 400    | Primary reading text                      |
| `body`      | 14/22              | 400    | Default UI text, table cells, labels      |
| `caption`   | 12/18              | 400    | Helper text, timestamps, metadata         |
| `label`     | 13/18              | 500    | Form labels, small buttons                |

**Font choice rule:** pick one variable sans-serif for UI (e.g. Inter, Geist,
or Manrope — something with a true 400–700 weight range and good numeral
tabular figures for tables/dashboards) and, only if the product needs
editorial warmth, one serif for marketing headlines. Two font families max.
Justify the choice in a comment at the top of `globals.css`: what it is,
why it was picked (legibility at small sizes, numeral clarity, license), and
where each is allowed to appear. Never let an agent silently swap fonts
between pages.

**Rules:**
- Never use arbitrary Tailwind text sizes (`text-[13.5px]`) — pick the
  nearest token.
- Body copy max line length ~65–75 characters for readability; constrain
  with `max-w-prose` or an explicit width, not by accident.
- Numbers in tables/dashboards use tabular figures (`font-variant-numeric:
  tabular-nums`) so columns align.

---

## 3. Design System — Color, Spacing, Elevation

- **Color tokens** are defined once as CSS variables (shadcn's
  `--background`, `--foreground`, `--primary`, `--muted`, `--destructive`,
  etc.) and consumed via Tailwind's `bg-*`/`text-*` semantic classes — never
  raw hex codes in components. This is what makes dark mode free.
- **Spacing scale:** stick to Tailwind's default 4px-based scale (1, 2, 3, 4,
  6, 8, 12, 16, 24...). Pick one spacing value per relationship type and
  reuse it everywhere (e.g. all card internal padding is `p-6`, all form
  field gaps are `gap-4`) — don't let two visually identical relationships
  use different values.
- **Radius:** one `--radius` variable, shadcn default. All cards, inputs,
  buttons inherit it. No mixed rounded-sm/rounded-xl in the same view.
- **Elevation:** use shadcn's shadow scale sparingly — flat design with a
  border is the default; shadow is reserved for things that float above
  content (dropdowns, dialogs, popovers, toasts).
- **Dark mode is not optional** — build every component against both
  `light` and `dark` from the start using semantic tokens, not patched in
  later.

---

## 4. API Design (Backend)

- **REST resource conventions:** plural nouns, nested where genuinely
  hierarchical (`/api/projects/:id/tasks`), verbs only for actions that
  aren't CRUD (`/api/invoices/:id/send`).
- **Standard response envelope** for every endpoint, success or failure:

```json
// success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "pageSize": 20, "total": 134 }
}

// failure
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable, user-safe message.",
    "field": "email",
    "requestId": "req_8f2c..."
  }
}
```
- `code` is a stable machine-readable enum the frontend can switch on.
  `message` is safe to show a user directly — never leak stack traces or DB
  errors. `requestId` enables support/debugging correlation.
- **HTTP status codes are meaningful**: 400 validation, 401 unauthenticated,
  403 unauthorized, 404 not found, 409 conflict, 422 unprocessable, 429 rate
  limited, 500 unexpected. Don't return 200 with `success: false` — use real
  status codes so caching, retries, and monitoring work correctly.
- **Pagination:** cursor-based for infinite lists/feeds, offset-based
  (`page`/`pageSize`) for admin tables. Always return `total` or `hasMore`.
- **Idempotency:** mutating endpoints that can be retried (payments,
  submissions) accept an `Idempotency-Key` header.
- **Versioning:** prefix with `/api/v1/...` from day one, even as a solo dev.

### The backend must respect the frontend experience

This is the part most APIs get wrong — treat it as a first-class
requirement, not a nice-to-have:

- **Report real progress, not just done/not-done.** For long operations
  (imports, exports, AI generations), expose a status endpoint or stream
  (SSE/WebSocket) with discrete states: `queued → processing → finalizing →
  done | failed`, not just a spinner tied to a single fetch promise. The
  frontend should be able to say "processing your file (2 of 5)" instead of
  a generic spinner.
- **Distinguish error types explicitly** so the frontend can react
  differently: validation errors go inline on the field, auth errors trigger
  a redirect, network/server errors show a retry toast, rate-limit errors
  show a "try again in Xs" message. This is why `code` exists in the
  envelope — the frontend maps `code → UI treatment` in one place (Section
  5), not per-call.
- **Never make the frontend guess how long something takes.** If an endpoint
  is fast (<300ms) it's fine to show nothing until response. Anything slower
  must support either streaming, a progress endpoint, or at minimum an
  estimated duration in the response so the frontend can render an
  appropriately-paced skeleton instead of a spinner that feels broken past
  3 seconds.
- **Return only what the view needs.** Don't make the frontend stitch
  together 4 endpoints to render one screen — that multiplies loading
  states and error states unnecessarily. Prefer view-shaped endpoints for
  complex dashboards.

---

## 5. Frontend Error Handling (Global, Not Ad-Hoc)

- One error-handling utility (e.g. `lib/api/handleApiError.ts`) parses the
  standard envelope from Section 4 and maps `error.code` to a UI treatment:
  - `VALIDATION_ERROR` → inline field error via react-hook-form's
    `setError`, using the `field` key from the response.
  - `UNAUTHORIZED` → redirect to `/login`, no toast needed.
  - `RATE_LIMITED` / `SERVER_ERROR` / network failure → shadcn `<Toast>`
    (or `<Sonner>`) with the `message`, plus a retry action where it makes
    sense.
  - Unknown/unexpected `code` → generic toast: "Something went wrong. Our
    team has been notified." (never show raw error text to the user).
- This utility is wired once into the React Query `QueryClient`'s global
  `onError`/`mutationCache` handler — individual components don't write
  their own try/catch for API errors unless they need bespoke recovery UI.
- `app/error.tsx` (route-level) and a top-level error boundary catch
  anything that slips through, with a friendly "something broke" screen and
  a reload action — never a blank white screen.

---

## 6. Loading & Transition Experience

This directly addresses the Next.js "click and nothing happens, then it all
pops in at once" problem:

- **Every route segment gets a `loading.tsx`.** This is what makes App
  Router show an immediate skeleton on navigation instead of a blank wait.
  If a page has server-fetched data, wrap the slow part in `<Suspense
  fallback={<Skeleton />}>` at a granular level (per-section, not just
  whole-page) so fast parts of the page render immediately and slow parts
  stream in with their own skeleton — this is "partial prerendering" done
  right, and it's the fix for the abrupt full-page pop-in.
- **Skeletons must match the real layout's shape and dimensions** (same
  card sizes, same number of rows) — a generic centered spinner is a fallback
  of last resort, not the default.
- **Never let a click feel unacknowledged.** Buttons that trigger async work
  show a loading state on the button itself (shadcn `<Button loading>`
  pattern: disable + spinner icon + keep label or swap to "Saving...") within
  the same frame the user clicks — do not wait for the network to update UI
  state.
- **Optimistic updates** for anything low-risk and reversible (toggles,
  likes, reordering, marking complete) — update UI instantly, roll back with
  a toast if the server rejects it.
- **Perceived performance floor:** if an action resolves in under ~200ms,
  the loading state may not even be visible — that's fine. Never
  artificially delay; never artificially skip a state that's needed for
  slower responses.

---

## 7. Component Rules

- Before building any UI element, check: does shadcn/ui have this? (button,
  input, textarea, select, combobox, checkbox, radio-group, switch, slider,
  dialog, alert-dialog, sheet, drawer, popover, tooltip, dropdown-menu,
  context-menu, command, tabs, accordion, collapsible, card, badge, avatar,
  separator, skeleton, progress, table, data-table, calendar, date-picker,
  toast/sonner, alert, breadcrumb, pagination, navigation-menu.) If yes, use
  it via `npx shadcn add <component>` — don't reimplement.
- Compose, don't fork: extend shadcn components via `className` + `cva`
  variants, not by copy-pasting and modifying the generated source, unless a
  genuine one-off is required — and even then, keep the change minimal and
  documented.
- One `<Button>` component, driven by `variant` (`default`, `secondary`,
  `outline`, `ghost`, `destructive`, `link`) and `size` — never a second
  bespoke button component elsewhere in the app.
- Icons: one icon library only (lucide-react, shadcn's default). Never mix
  icon sets — inconsistent stroke widths are an instant "AI-built" tell.

---

## 8. Performance & Developer Experience

- Server Components by default; `"use client"` only where interactivity is
  actually needed — push client boundaries as low/leaf as possible.
- Memoize expensive derived data (`useMemo`) and stable callbacks passed
  deep (`useCallback`), but don't cargo-cult it on every function — measure
  before optimizing.
- Choose algorithms/data structures for the actual data scale: don't reach
  for a virtualized list for 20 items, don't skip virtualization
  (`@tanstack/react-virtual`) for 1000+ row tables.
- Images via `next/image` always, fonts via `next/font` always (self-hosted,
  no layout shift).
- Lint/format: ESLint + Prettier enforced pre-commit. TypeScript strict, no
  `any` without a `// TODO` justification comment.
- Naming: `camelCase` for functions/vars, `PascalCase` for components/types,
  `kebab-case` for file names except component files which match their
  component name.
- Accessibility isn't optional: every interactive element keyboard-reachable,
  every icon-only button has an `aria-label`, color contrast meets WCAG AA
  minimum (shadcn + semantic tokens get this mostly for free — don't break
  it with custom colors).

---

## 9. Definition of "Done" for Any Feature

A feature is not complete until it has: a loading state, an empty state, an
error state, and a success state — all four, not just the happy path. If any
of the four is missing, the feature is unfinished, regardless of whether the
core logic works.