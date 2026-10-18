# mercadinho-jr-financas

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components, Turbopack)
- **Language**: TypeScript 5.7+
- **UI/Styling**: shadcn/ui + Tailwind CSS v4
- **Unit Testing**: Jest + Testing Library
- **E2E Testing**: Playwright
- **Linting/Formatting**: Biome
- **Validation**: Zod
- **Commits**: Conventional Commits (commitlint + husky)

## Commands

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run test:unit` — Run unit tests
- `npm run test:e2e` — Run E2E tests
- `npm run lint` — Run linter

## Project Structure

```
src/
  app/           — Next.js App Router pages and layouts
  components/    — Reusable UI components
  config/        — Environment and app configuration
  lib/           — Utility functions
```

## Guidelines

- Use Server Components by default; add `"use client"` only when needed.
- Named exports for everything except `page.tsx` files.
- Follow Conventional Commits for all git messages.
- Validate env vars with Zod in `src/config/env.ts`.
