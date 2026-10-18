# mercadinho-jr-financas

A [Next.js 15](https://nextjs.org/) project bootstrapped with [react-creator-cmd](https://github.com/rivailJunior/react-creator-cmd).

## Tech Stack

- **Next.js 15** — App Router, Server Components, Turbopack
- **React 19** — Latest React with Server Components
- **TypeScript 5.7+** — Strict type checking
- **shadcn/ui + Tailwind CSS v4** — Styling
- **Jest** — Unit testing
- **Playwright** — E2E testing
- **Biome** — Code quality
- **Zod** — Schema validation
- **Conventional Commits** — Commit convention (commitlint + husky)

## Getting Started

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server (with Turbopack)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run linter |
| `npm run test:unit` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |

## Project Structure

```
src/
├── app/            # Next.js App Router (pages, layouts)
├── components/     # Reusable UI components
├── config/         # Environment config (Zod validated)
└── lib/            # Utility functions
```

## AI Assistant Support

This project includes configuration files for AI coding assistants:

- `.cursor/rules/` — Cursor IDE rules
- `.windsurf/rules/` — Windsurf IDE rules
- `.github/copilot-instructions.md` — GitHub Copilot context
- `CLAUDE.md` — Claude Code context

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

## Deploy

The easiest way to deploy is with [Vercel](https://vercel.com/new).
