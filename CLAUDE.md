# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on localhost:5173 (strictPort — fails if occupied)
npm run build    # Production build
npm run preview  # Preview production build
```

No test suite or linter configured.

## Architecture

Vanilla JS SPA using Vite (no framework). Entry point is `main.js` at the repo root (not `src/main.js`, which is an unused Vite scaffold).

### State & Rendering Flow

Global pub/sub state lives in `src/lib/state.js`. `main.js` subscribes to state changes and calls `renderApp()` on every update. `renderApp()` decides what to show (loading screen → login → blocked subscription → main layout) and delegates panel rendering to the hash-based router in `src/router.js`.

The router uses a 45s timeout per panel render. **Critical rule**: every panel that needs Supabase data must render its skeleton UI synchronously first, then fetch in the background. Never `await` before returning from a render function — the router will time it out.

### Key Modules

- `src/lib/state.js` — global state, `getState()` / `setState()` / `subscribe()`
- `src/lib/auth.js` — Supabase auth init, user data loading with stale-while-revalidate localStorage cache (`ca_cache_v1_<userId>`), channel CRUD. Uses `getState().session.user` for mutations — **never** call `supabase.auth.getUser()` inside mutation functions.
- `src/lib/intelligence.js` — all Gemini AI calls. `callAI(promptType, userContent, context)` uses `SYSTEM_PROMPTS` + `MODEL_MAPPING`. `generateImage(prompt, faceImageUrl)` uses the dedicated image model. API key is stored in Supabase (`get_decrypted_api_key` RPC), never in client code.
- `src/lib/supabase.js` — Supabase client (URL and anon key hardcoded, they're public).
- `src/router.js` — hash-based routing. `registerRoute(hash, renderFn)` / `navigateTo(hash)` / `reRenderCurrentRoute(workspace)`.
- `src/lib/toast.js` — `toast()`, `confirmDialog()`, `inputDialog()` helpers.
- `src/lib/loader.js` — `showLoader()`, `updateLoader()`, `hideLoader()` overlay helpers.

### Panels (`src/panels/`)

Each panel exports a single `renderPanel(container)` function registered as a route:

| Route | Panel | Purpose |
|---|---|---|
| `dashboard` | `dashboard.js` | CTR analytics charts |
| `brand` | `brand.js` | Brand Kit — ADN interview + style analysis |
| `cerebro` | `cerebro.js` | ADN analysis + channel intelligence |
| `espionaje` | `espionaje.js` | Competitor thumbnail analysis |
| `angulos` | `angulos.js` | Angle generation for thumbnails |
| `engine` | `engine.js` | AI thumbnail generator (formats + styles) |
| `editor` | `editor.js` | Thumbnail editor & simulator |
| `settings` | `settings.js` | API key config, user settings |
| `channel-selector` | `channel-selector.js` | Hub — channel switcher |
| `admin` | `admin.js` | Admin-only user/subscription management |

### Supabase Schema (key tables)

- `profiles` — `id, email, full_name, avatar_url, subscription_tier, role, created_at`
- `subscriptions` — `user_id, status, duration_type, start_date, end_date, block_date`
- `channels` — channel data, `owner_id`
- `channel_members` — `channel_id, user_id, role`

Subscription `status === 'blocked'` locks the user out (except `role === 'admin'`). `status === 'load_error'` means fail-open (allow access).

### Gemini AI

Models are set per prompt type in `MODEL_MAPPING`. All text prompts use `response_mime_type: "application/json"`. Image generation uses `gemini-3.1-flash-image-preview` with `responseModalities: ['TEXT', 'IMAGE']`. Model names require exact suffixes (`-preview`, `-flash`, etc.) — verify with `ListModels` if a 404 occurs.

## Hard-Won Rules (from `.agent/LOG_DE_ERRORES.md`)

- **Event delegation**: always attach events to the local `container`, never via `document.getElementById()` for dynamic elements.
- **Logout**: clear localStorage `sb-*` tokens and call `setState(...)` synchronously before `supabase.auth.signOut()` (fire-and-forget).
- **loadUserChannels deduplication**: the function uses an in-flight promise lock (`let channelsPromise = null`). The Hub/channel-selector must read from state, not re-fetch.
- **significantChange in `main.js`**: includes `channels.length` — required so the hub re-renders when channels load without a channel ID change.
- **Supabase cold start**: `fetchWithRetry` uses 15s timeout with 3 attempts (Supabase Pro). Do not lower these timeouts.
- **TOKEN_REFRESHED event**: only update `session` in state, never call `loadUserData` — doing so deadlocks all DB queries until timeout.
