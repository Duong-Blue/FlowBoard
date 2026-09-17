# PROJECT KNOWLEDGE BASE

**Generated:** 2026-09-16
**Commit:** d12f2a2
**Branch:** master

## OVERVIEW
FlowBoard is a full-stack Jira/Trello-like issue management application. Backend built with NestJS 12 + Prisma 7 + PostgreSQL, Frontend built with React 19 + Vite 8 + Redux Toolkit + Tailwind CSS v4.

## STRUCTURE
```
_FlowBoard/
├── backend/                  # NestJS API server (Port 3000)
│   ├── prisma/               # Database schema & migrations
│   └── src/                  # NestJS application source
├── frontend/                 # React SPA (Port 5173, Vite proxy /api -> :3000)
│   └── src/                  # React components, pages, features, store
└── docker-compose.yml        # PostgreSQL container setup
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| API Routes & Endpoints | `backend/src/modules/` | NestJS controller & service per domain |
| DB Schema & Migrations | `backend/prisma/schema/` | Multi-file Prisma schema split |
| Issue Board & Drag-Drop | `frontend/src/features/issues/` | DnD Kit Kanban board & issue details |
| UI Components | `frontend/src/components/ui/` | Radix UI primitives with Tailwind v4 |
| Global State & Auth | `frontend/src/store/` | Redux Toolkit slices & credentials |
| API Axios Client | `frontend/src/utils/api_helper.ts` | Bearer auth header & auto-refresh token |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `AppModule` | Module | `backend/src/app.module.ts` | Root | Main NestJS app module registering domain modules |
| `ProjectsController` | Controller | `backend/src/modules/projects/projects.controller.ts` | 5 | Project CRUD API routes |
| `IssuesService` | Service | `backend/src/modules/issues/issues.service.ts` | 8 | Issue state, ordering & Fractional Indexing |
| `api` | Axios | `frontend/src/utils/api_helper.ts` | 15+ | Centralized Axios instance with auth interceptor |
| `useAppDispatch` | Hook | `frontend/src/store/hooks.ts` | 20+ | Typed Redux dispatch hook |

## CONVENTIONS
- Frontend path alias: `@/*` maps to `./src/*`.
- Backend code formatting: Prettier singleQuote `true`, trailingComma `"all"`.
- Backend linting: Oxlint (`npm run lint`).
- Frontend linting: Oxlint with `react/rules-of-hooks` enabled.
- Frontend API proxy: Vite proxies `/api/*` to `http://localhost:3000/api`.

## ANTI-PATTERNS (THIS PROJECT)
- DO NOT edit `backend/prisma/schema/migrations/migration_lock.toml` manually.
- DO NOT add seed data to `backend/prisma/seed.ts` until schema design is finalized.
- DO NOT place frontend DTOs or models directly in UI components; keep types in `store/types.ts` or feature folders.
- DO NOT bypass `api_helper.ts` for HTTP requests (prevents token auto-refresh).

## UNIQUE STYLES
- Drag-and-drop issue ordering uses `fractional-indexing` string keys for smooth reordering without re-indexing all items.
- DTO placement on backend is mixed: core modules use `dto/` subfolders, while some legacy modules keep `.dto.ts` in module root.

## COMMANDS
```bash
# Backend
cd backend && npm run start:dev   # Start NestJS API dev server
cd backend && npm run test        # Run backend Vitest unit tests
cd backend && npm run test:e2e    # Run backend E2E tests

# Frontend
cd frontend && npm run dev        # Start Vite React dev server
cd frontend && npm run build      # TypeScript check + Vite production build
cd frontend && npm run test       # Run frontend Vitest tests
```

## NOTES
- Database requires PostgreSQL running on port 5432 (configured via `.env` or `docker-compose.yml`).
- Auth flow uses JWT access token (stored in memory/Redux) + refresh token (stored in localStorage).
