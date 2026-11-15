# @ui-sdk-demo/ui

Styled design-system package on [ui-sdk](https://ui-sdk.dev). ui-sdk owns keyboard, focus, and ARIA. This package owns the theme, how you ship the components, and a catalog agents use to build pages.

## Layers

| Layer | Source | You use it for |
| --- | --- | --- |
| Interaction | `@ui-sdk/web` / `@ui-sdk/core` | Dialogs, tabs, toggles, focus traps |
| Theme + ship | this package | Tokens, npm entries, CDN auto-loader |
| Page vocabulary | `catalog.ts` | Marketing blocks + interactive types an agent may emit |

You keep the same `ui-*` tags as ui-sdk docs. The theme and loader sit around them.

**App UI:** import themed entries (or drop the CDN loader) and write markup yourself.

**Generated pages:** the agent reads the catalog, emits a json-render Spec, and you render it. The catalog is a fence: Hero, Section, Grid, Card, Cta, Quote plus the interactive types. Freeform HTML is out of scope on purpose.

## Live demos

Live at **https://jagreehal.github.io/ui-sdk-demo/** (built from [`docs/`](./docs/) by CI):

- [Components](https://jagreehal.github.io/ui-sdk-demo/components.html) — full showcase via the CDN loader
- [CDN loader](https://jagreehal.github.io/ui-sdk-demo/cdn.html) — one script, on-demand entries
- [Catalog page](https://jagreehal.github.io/ui-sdk-demo/generated.html) — Spec → HTML with pricing switch and dialog
- [Pulse](https://jagreehal.github.io/ui-sdk-demo/examples/pulse/) — a groovebox: stock components, a composed `ui-step-grid`, a brand that is only tokens, Web Audio
- [Brand Studio](https://jagreehal.github.io/ui-sdk-demo/examples/studio/) — four choices become every token; a generated page and the components re-skin live
- [Executable stories](https://jagreehal.github.io/ui-sdk-demo/report/) — Playwright proves each claim above, with screenshots

Refresh after a library build:

```bash
npm run pages
```

`.github/workflows/ci.yml` runs typecheck, unit tests and the stories on every push and PR, and on `main` publishes `docs/` to Pages. In the repo settings, set **Pages → Source** to **GitHub Actions**.

Local Vite demos (with the agent generator): `npm run build && npm run dev`, then `/`, `/cdn.html`, `/agent.html`, `/examples/pulse/`, `/examples/studio/`.

## Re-brand with tokens

Every component reads `--ds-*` tokens from `theme.css`. A brand overrides them after it and changes no component CSS:

| Token | Role |
| --- | --- |
| `--ds-ink`, `--ds-ink-soft` | Text, muted text |
| `--ds-paper`, `--ds-paper-2` | Page and recessed backgrounds |
| `--ds-surface` | Raised surfaces: cards, popups, dialogs |
| `--ds-line` | Borders |
| `--ds-accent`, `--ds-accent-soft`, `--ds-accent-ink` | Brand color, its tint, text on the tint |
| `--ds-on-accent` | Text and icons on the accent |
| `--ds-scrim`, `--ds-warn`, `--ds-warn-soft` | Backdrops, warnings |
| `--ds-radius`, `--ds-radius-lg`, `--ds-font`, `--ds-font-mono`, `--ds-shadow` | Shape and type |

[Pulse](./examples/pulse/style.css) is a dark brand written this way. [Brand Studio](https://jagreehal.github.io/ui-sdk-demo/examples/studio/) derives the whole set from an accent, a mode, a radius and a typeface, checks WCAG contrast, and gives you the CSS to paste.

## Compose a branded component

When ui-sdk doesn't ship a component, build it from `@ui-sdk/core` behaviors so it gets the same keyboard, focus, ARIA and agent support, then ship it like any other entry. [`src/components/step-grid.ts`](./src/components/step-grid.ts) is the template: a `definePrimitive` on `createGridFocus` (one tab stop, arrow keys, Space to toggle, `role="grid"`), `agent.actions` so agents can call `setTrack` and `clear`, and `createParts` to register `ui-step-grid*` tags. Its styles live in `theme.css`, so every brand restyles it for free, and the loader fetches it when its tag appears.

```ts
import { stepGridHtml } from "@ui-sdk-demo/ui/step-grid"

grid.innerHTML = stepGridHtml(["Kick", "Snare", "Hat"], 16)
grid.tracks = ["Kick", "Snare", "Hat"]
grid.addEventListener("valuechange", (event) => (grid.value = event.detail.value))
```

## Install

```bash
npm install @ui-sdk-demo/ui @ui-sdk/web @ui-sdk/core
```

`@ui-sdk/web` and `@ui-sdk/core` are peer dependencies.

## npm (bundler)

```ts
import "@ui-sdk-demo/ui/theme.css"
import "@ui-sdk-demo/ui/dialog"
import "@ui-sdk-demo/ui/toggle"
```

```html
<ui-toggle><button type="button">Bold</button></ui-toggle>

<ui-dialog>
  <ui-dialog-trigger><button type="button">Open</button></ui-dialog-trigger>
  <ui-dialog-backdrop hidden></ui-dialog-backdrop>
  <ui-dialog-content hidden>
    <ui-dialog-title>Hello</ui-dialog-title>
    <ui-dialog-close><button type="button">Close</button></ui-dialog-close>
  </ui-dialog-content>
</ui-dialog>
```

## CDN (no build step for consumers)

After `npm run build`, host `dist/cdn/` (or the copied `docs/ui/` tree):

```html
<link rel="stylesheet" href="https://cdn.example.com/ui/theme.css" />
<script type="module" src="https://cdn.example.com/ui/loader.js"></script>

<ui-toggle><button type="button">Bold</button></ui-toggle>
```

`loader.js` scans for `ui-*` tags and fetches only those entries.

## Entries

`accordion`, `button`, `checkbox`, `color-picker`, `dialog`, `field`, `input`, `menu`, `menubar`, `meter`, `popover`, `segmented-control`, `select`, `slider`, `switch`, `tabs`, `toast`, `toggle`, `toolbar`, `tooltip`, the composed `step-grid`, plus `loader` and `theme.css`.

## Agent / generative UI

This package is a [json-render](https://github.com/vercel-labs/json-render) catalog + renderer for ui-sdk web components (same role as `@json-render/shadcn` for React).

1. Read `catalog.ts` or call `catalog.prompt()` — those types are the allowlist.
2. Emit a flat Spec: `{ root, elements }` with `children` as string keys into `elements`.
3. Render with `specToPage` (static HTML, works in plain Node) or `renderSpec(spec, mount)` (live DOM).
4. Leave entry loading to the CDN loader; do not eagerly import every module.

Marketing composites (`Hero`, `Section`, `Grid`, `Card`, `Cta`, `Quote`) are plain HTML styled by `theme.css`. Interactive types become `ui-*` tags the loader upgrades.

```ts
import { compileSpecStream } from "@json-render/core"
import { catalog } from "@ui-sdk-demo/ui/catalog"
import { specToPage } from "@ui-sdk-demo/ui/spec-html"

const { text } = await generateText({ model, system: catalog.prompt(), prompt: brief })
const spec = compileSpecStream(text)
if (!catalog.validate(spec).success) throw new Error("invalid spec")
const html = specToPage(spec, { title: "Fieldnote", assetsBase: "https://cdn.example.com/ui/" })
```

Specs may use json-render `state`, `visible`, `repeat`, `on.press → setState`, and `$bindState`. `runtime.ts` (`hydrate`) wires those to ui-sdk properties (`open`, `checked`, `pressed`, `value`) and change events. Static pages embed the Spec only when they need that runtime; the loader fetches it then.

`docs/generated.html` is `sampleSpec` (`src/sample-spec.ts`, re-exported by `catalog.ts`) run through `specToPage`.

### Local agent demo

Copy `.env.example` → `.env`. Set `UI_SDK_MODEL` (`provider/model`, default `opencode-go/beam-free`) and `OPENCODE_API_KEY`. Run `npm run build && npm run dev` and open `/agent.html`. Generation goes through Vite `/api/generate` so keys stay server-side. Use `ollama/…` when [Ollama](https://ollama.com) is running.

`npm test` covers the renderer: repeat, visibility, escaping, and href filtering.

### Executable stories

`npm run stories` builds `docs/`, serves it under `/ui-sdk-demo/` with real 404s (as Pages does), and runs Playwright stories against it: every demo linked from the landing page opens cleanly, content is in the HTML with JavaScript off, only the used entry chunks load, the runtime stays under 20 kB, Spec state drives dialogs and pricing, the composed step grid works by keyboard, Pulse and the studio respond to ui-sdk's agent bridge and to a browser agent over WebMCP, and contrast checks hold. Any console error, page error or same-origin 4xx/5xx fails a story. It writes `docs/report/index.html`, which CI rebuilds and publishes on every push to `main`.

Tests follow the layout in `tests/`: specs ask `fixtures.ts` for page objects (`tests/pages/`) and components (`tests/components/`, like the container-rooted `StepGrid` and the `WebMcp` double), and never hold selectors for interactions.

```bash
npx playwright install chromium   # once
npm run stories
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite showcase + agent demo |
| `npm run build` | npm `dist/` + CDN `dist/cdn/` + theme |
| `npm run pages` | Build, then copy CDN into `docs/ui/` and refresh `generated.html` |
| `npm run preview` | Preview the Vite app |
| `npm test` | Renderer tests |
| `npm run stories` | Playwright executable stories → `docs/report/index.html` |
| `npm run typecheck` | `tsc` over src, scripts, tests and config |

## Agents

Interaction behavior is ui-sdk’s. Follow the ui-sdk skill and `node_modules/@ui-sdk/web/docs/llms.txt`. Use this package for theme tokens and distribution. For generative pages, use `src/catalog.ts` + `renderSpec` / `specToPage`. See `AGENTS.md`.
