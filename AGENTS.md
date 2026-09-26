<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Context

- Frontend Next.js 16 untuk EBITDA Max APN; backend Go ada di `../ebitda-refactor` (API base `/api/v1`, session cookie `ebitda_session`).
- Ini adalah refactor dari aplikasi Laravel/Inertia di `../ebitdamax-apn`. Saat ada layar yang sudah ada di sana, ikuti information architecture & copy-nya; shape data ikuti Go API.

# AI Slop Design

- Activate the `ai-slop-design` skill whenever you create or edit files under `src/app` or `src/components`, or when choosing colors, typography, spacing, radius, shadows, icons, charts, or empty states—and when asked to review, audit, or redesign a screen.
- Skill source: `.opencode/skills/ai-slop-design/SKILL.md`.
- Hard rules: use design tokens from `src/app/globals.css` only (no raw palette colors), keep the red primary (no purple/indigo gradients), reuse `@/components/ui` and `@/lib/formatters`, write UI copy in Bahasa Indonesia, and support light/dark mode plus 360px width.
- Run the skill's "Slop Gate" checklist before reporting frontend work as done.
