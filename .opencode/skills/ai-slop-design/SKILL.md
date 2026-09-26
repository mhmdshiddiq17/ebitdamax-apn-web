---
name: ai-slop-design
description: "Anti-AI-slop design guard for this project's Next.js + Tailwind CSS UI. Use when creating or editing pages/components under src/app or src/components, when choosing colors, typography, spacing, radius, shadows, icons, charts, or empty states, or when asked to review, audit, or redesign a screen so it does not look generically AI-generated."
license: MIT
metadata:
  author: ebitdamax
---

# AI Slop Design

This is an internal finance/operations tool (EBITDA Max APN), not a marketing site. The visual target is **calm, dense, data-first, intentional**. The enemy is the averaged-out LLM aesthetic: purple gradients, glassmorphism, emoji, and three identical feature cards.

Context: this app is the Next.js rewrite of the Laravel/Inertia app `../ebitdamax-apn`, consuming the Go API `../ebitda-refactor`. When a screen already exists in the Laravel app, keep its information architecture and copy; match data shapes from the Go API. Do not copy incidental styling from either.

## When to Apply

Activate this skill when:

- Creating or editing files under `src/app` or `src/components`
- Choosing or changing color, typography, spacing, radius, shadow, icon, chart, or motion
- Building empty, loading, or error states
- Asked to review, audit, polish, or redesign an existing screen
- The user mentions "slop", "generic", "AI-generated look", "looks like a template", or "shadcn default"

## Project Ground Truth

- **Design system**: shadcn (`base-nova` style, `components.json`), Tailwind CSS 4 with CSS variables in `src/app/globals.css`
- **Tokens only**: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, `ring-ring`, `text-destructive`, etc. Never raw palette values (`bg-blue-500`, `text-purple-700`) except in existing intentional data encodings.
- **Brand color is red** (`--primary` ≈ `oklch(0.577 0.245 27.325)`). Do not introduce purple/indigo/violet as brand or gradient.
- **Font is set** (Geist via `--font-sans` / `--font-heading`). Do not add fonts.
- **Icons**: `lucide-react` only, consistent stroke width and size (default `size-4`, page headers `size-5`). No emoji as UI icons.
- **Reuse first**: `src/components/ui/*` for primitives, `app-sidebar`/`app-header` for layout, `@/lib/formatters` for currency/number/date formatting (`formatRupiah`, `formatDate`), `apiFetch`/`serverApiFetch` for data.
- **Charts**: Recharts with `--color-chart-1..5` tokens (see `src/components/kdkmp-dashboard/financial-matrix.tsx`). No decorative gradients or drop shadows on series.
- **Copy**: Bahasa Indonesia, sentence case, factual. No marketing verbs ("Elevate", "Seamlessly", "Unlock"), no exclamation marks, no emoji.
- **Every screen**: works in light and dark mode, usable from 360px width, tables scroll horizontally or collapse to a list.
- **Exception**: some files intentionally encode hierarchy with hue (chart series, status variants). Leave deliberate data encodings alone; the ban is on decorative purple/indigo gradients.

## Banned Slop Patterns

| # | Pattern | Do instead |
| --- | --- | --- |
| 1 | Purple→blue gradient hero, buttons, or text (`from-purple-500 to-blue-500`, `bg-clip-text`) | Solid `bg-primary` or `bg-secondary`; differentiation via type and density |
| 2 | Glassmorphism (`backdrop-blur` + translucent cards) as decoration | `bg-card` with `border-border`; use blur only for real overlays (dialogs, sticky headers) |
| 3 | Three identical feature cards with icon + title + paragraph | Use the data layout the screen needs: table, filters, summary stats |
| 4 | `rounded-full` / `rounded-3xl` on everything, including cards and inputs | Follow existing radius scale (`rounded-md`, `rounded-lg` via `--radius`) |
| 5 | Airy marketing spacing inside the app (`py-24`, `gap-12`, giant centered hero) | Page header → filters/actions → content; spacing steps of 4/6/8 |
| 6 | Glow shadows (`shadow-[0_0_50px_...]`, `shadow-2xl` on flat panels) | `shadow-sm`/`shadow-xs` only for real elevation (popovers, dialogs) |
| 7 | Gradient or neon chart series, rainbow palettes | `--chart-*` tokens, max 2–3 hues, direct labels where possible |
| 8 | `transition-all`, hover `scale-105`, entrance animations everywhere | Transition only `colors`, `opacity`, `transform` on interactive elements; motion must be functional |
| 9 | Fake stats, testimonials, lorem ipsum, placeholder "John Doe" | Real empty state with a concrete next action, or `Skeleton` while loading |
| 10 | Emoji or `Sparkles` icon as bullets/status | Status via `Badge` variants and `text-muted-foreground` microcopy |
| 11 | Centered text for paragraphs, forms, or data-heavy content | Left-aligned; numbers right-aligned in tables |
| 12 | Dashboards where every number is `text-4xl font-bold` | Establish one primary metric per card; secondary numbers use `text-sm tabular-nums` |
| 13 | Icon-only buttons without accessible name | Add `aria-label` + `Tooltip`; keep focus-visible ring |
| 14 | New dependency (font, animation lib, icon pack) for a visual tweak | Solve with existing tokens/components |

## Workflow

1. Before writing markup, read 2–3 sibling files in the same feature folder to copy established structure and spacing (e.g. `src/app/(app)/dashboard/kdkmp/page.tsx`, `src/app/(app)/settings/profile/page.tsx`).
2. Prefer composing existing `@/components/ui` primitives over hand-rolled divs. If a pattern repeats, extract it into `src/components/<feature>`.
3. Use tokens for all colors, borders, radii, and shadows. If a new semantic color is genuinely needed, add a CSS variable in `src/app/globals.css` instead of hard-coding.
4. Build the full state matrix: loading, empty, error, happy path.
5. Run the Slop Gate below before reporting done.

## Slop Gate

Run this checklist (and where useful, grep) before finishing UI work:

- [ ] No banned pattern from the table above
- [ ] Colors come only from tokens; grep `src` for new `purple|indigo|violet|gradient|backdrop-blur|rounded-3xl|shadow-2xl|scale-1` occurrences
- [ ] Reused existing `ui` components, sidebar/header layout, and `@/lib/formatters`
- [ ] Light and dark mode both sane (no hard-coded `text-white` on token backgrounds, no `bg-white`)
- [ ] 360px width checked; table has overflow handling; dialogs fit mobile
- [ ] Copy is Bahasa Indonesia, sentence case, no marketing fluff
- [ ] Empty/loading/error states included, not just the happy path
- [ ] Icon-only buttons have `aria-label`; focus states visible; contrast ≈ 4.5:1
- [ ] No new design dependency added

## Audit Mode

When asked to review or redesign a screen:

1. Report violations grouped by file with `file:line` and the specific banned pattern.
2. Propose the smallest fix that reuses existing components and tokens — do not rewrite a whole page for style points.
3. Separate decorative slop from intentional data encodings (chart hues, status variants); only flag the former.
4. If a redesign is requested, preserve information architecture, copy, and accessibility while rebuilding the layout.
