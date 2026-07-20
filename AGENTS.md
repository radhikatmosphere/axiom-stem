# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 15 App Router application for AXIOM's STEM tutor. Route UI and server endpoints live in `app/`: `app/page.tsx` is the main experience and `app/api/*/route.ts` contains narrative, progress, and telemetry handlers. Reusable UI belongs in `components/`; deterministic STEM logic and external-service clients belong in `lib/`. Shared TypeScript types are in `types/`, static assets and Firebase client configuration are in `public/`, and project documentation is in `docs/` and `submission/`. Keep experiments in `bench/` and executable tests in `tests/`.

## Build, Test, and Development Commands

- `npm install` installs the locked Node dependencies.
- `npm run dev` starts the local Next.js development server at `http://localhost:3000`.
- `npm run build` creates a production build; use `npm run start` to serve it locally.
- `npm run lint` runs the configured Next.js ESLint command.
- `node tests/decomposers.test.mjs` bundles and tests `lib/decomposers.ts`; it writes generated test artifacts to `logs/`.
- `npm run pages:build` prepares a Cloudflare Pages output. `npm run pages:deploy` builds and deploys it; run this only when deployment is intended.

## Coding Style & Naming Conventions

Use TypeScript for application code and follow the existing four-space indentation, semicolons, and double-quoted strings. Name React components in PascalCase (for example, `NarrativePanel.tsx`), helpers in camelCase, and routes using the App Router convention (`app/api/<feature>/route.ts`). Keep Layer 1 decomposers deterministic and network-free; put narrative or third-party calls behind `lib/` clients or API routes. Use Tailwind utility classes and shared rules in `app/globals.css` rather than adding one-off global styles.

## Testing Guidelines

Add focused assertions to `tests/decomposers.test.mjs` when changing combinatorial outputs. Give cases behavior-oriented names such as `"C(5,3) = 10"` and cover normal inputs plus boundary or normalization behavior. No coverage threshold is configured; run the relevant test command and ensure it exits with code 0 before opening a PR. Avoid committing generated files under `logs/`.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit-style subjects: `feat: ...`, `docs: ...`, `chore: ...`, and `deploy: ...`. Use an imperative, concise summary, scoped when useful. PRs should explain the user-facing or algorithmic change, list validation commands run, link the relevant issue or hackathon requirement, and include screenshots or a short recording for UI changes. Do not include API keys, Firebase credentials beyond the intended public client config, or deployment secrets; use `.env.local` for local variables such as `XAI_API_KEY` and Splunk HEC settings.
