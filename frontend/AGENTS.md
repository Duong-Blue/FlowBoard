# FRONTEND KNOWLEDGE BASE

## OVERVIEW
React 19 SPA built with Vite 8, TypeScript, Tailwind CSS v4, Redux Toolkit, React Router v7, Radix UI primitives, and @dnd-kit.

## STRUCTURE
```
frontend/
├── src/
│   ├── assets/               # Static assets & icons
│   ├── components/           # Shared UI & layout components
│   │   ├── shared/           # Common app components (Header, Sidebar, Modals)
│   │   └── ui/               # Radix UI primitives styled with Tailwind
│   ├── features/             # Feature-sliced domain modules (e.g. issues/)
│   ├── hooks/                # Custom React hooks
│   ├── layouts/              # Route layout wrappers (MainLayout, AuthLayout)
│   ├── pages/                # Top-level page views (Projects, Orgs, Auth)
│   ├── services/             # Axios API service calls
│   ├── store/                # Redux Toolkit store, slices, and typed hooks
│   ├── utils/                # Helper functions (`api_helper.ts`, `cn`)
│   ├── App.tsx               # Route definitions & app providers
│   └── main.tsx              # Application entrypoint
├── vite.config.ts            # Vite config with path alias `@/*` -> `./src/*`
└── vitest.config.ts          # Vitest config with JSDOM
```

## WHERE TO LOOK
| Task | Location | Key Files |
|------|----------|-----------|
| Issue Kanban Board | `src/features/issues/` | `components/BoardColumn.tsx`, `pages/BoardPage.tsx` |
| API Calls | `src/services/` | `projectService.ts`, `issueService.ts`, `authService.ts` |
| Axios Setup & Auth | `src/utils/api_helper.ts` | Interceptors for Bearer token & refresh |
| UI Primitives | `src/components/ui/` | `button.tsx`, `dialog.tsx`, `dropdown-menu.tsx` |
| State Management | `src/store/` | `store.ts`, `slices/authSlice.ts`, `types.ts` |

## CONVENTIONS
- Path alias: `@/*` resolves to `./src/*` (e.g. `import { Button } from '@/components/ui/button'`).
- Styling: Tailwind CSS v4 utility classes + `clsx` / `tailwind-merge` (`cn()` helper).
- Components test naming: `*.test.tsx`.
- Wrap tests with `renderWithProviders` from `src/utils/test-utils.tsx`.

## ANTI-PATTERNS
- DO NOT fetch API data inside raw components without using service layer or Redux thunks.
- DO NOT hardcode API base URLs; use `api_helper.ts` helper methods (`apiGet`, `apiPost`, etc.).
