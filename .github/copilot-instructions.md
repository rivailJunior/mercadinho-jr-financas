# Project Rules

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components, Turbopack)
- **Language**: TypeScript 5.7+
- **UI/Styling**: shadcn/ui + Tailwind CSS v4
- **Unit Testing**: Jest + Testing Library
- **E2E Testing**: Playwright
- **Linting/Formatting**: Biome
- **Validation**: Zod
- **Commits**: Conventional Commits (commitlint + husky)

## Architecture

- **App Router**: All routes live under `src/app/`. Use Server Components by default; add `"use client"` only when needed (interactivity, hooks, browser APIs).
- **Feature-first structure**: Group related components, hooks, and utils by feature, not by type.
- **Path aliases**: Use `@/` to import from `src/` (configured in `tsconfig.json`).

## Coding Conventions

- Use **named exports** for all components and utilities (default exports only for `page.tsx` files).
- Use **camelCase** for variables, functions, hooks, and test files.
- Use **PascalCase** for components and type/interface names.
- Prefix event handlers with `handle` (e.g., `handleClick`, `handleSubmit`).
- Use `const` with arrow functions for component logic.
- Define **types or interfaces** for all props and function signatures.
- Avoid magic strings/numbers — use constants or enums.

## Component Guidelines

- Components should follow the **Single Responsibility Principle**.
- Keep components **stateless when possible**; move business logic into hooks or context.
- Use **composition over inheritance**.
- Use **semantic HTML** tags and follow accessibility best practices.
- Validate environment variables with **Zod** in `src/config/env.ts`.

## Testing

- Every new component should have a corresponding unit test.
- E2E tests cover critical user flows.
- Run `npm run test:unit` for unit tests.
- Run `npm run test:e2e` for E2E tests.

## Git

- Follow **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Keep commits small and focused.
