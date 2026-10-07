# FRONTEND FEATURES ARCHITECTURE

## OVERVIEW
Feature-based organization for React/Vite components, logic, and state.

## STRUCTURE
```
features/
├── issues/
│   ├── components/    # Feature-specific UI
│   ├── hooks/         # Feature logic
│   └── slice/         # Redux state & optimistic logic
└── ...
```

## CONVENTIONS
- **Optimistic UI**: Use `x-correlation-id` header for request matching.
- **Routing**: Delegate sub-routing to features (prefer to clean up centralized `App.tsx` routes).
- **Component Placement**: All UI components MUST live in `features/<feature>/components/`, NOT `pages/`.

## ANTI-PATTERNS
- DO NOT place feature logic or state in `pages/`. Keep `pages/` thin (just layout + imports).
- DO NOT bypass `api_helper.ts` for HTTP requests.
- DO NOT inject store via global `injectStore` workaround if avoidable (prefer context/hooks).
