# BACKEND KNOWLEDGE BASE

## OVERVIEW
NestJS 12 application with Prisma 7 ORM, PostgreSQL database, Passport JWT authentication, and Vitest test runner.

## STRUCTURE
```
backend/
├── prisma/                   # Prisma schema & migrations
│   └── schema/               # Modular .prisma schema files
├── src/
│   ├── common/               # Shared guards, decorators, filters
│   ├── config/               # App configuration loaders
│   ├── database/             # Prisma service wrapper
│   ├── modules/              # Feature modules (Auth, Projects, Issues, etc.)
│   └── main.ts               # App entrypoint (port 3000)
├── test/                     # End-to-end test files
└── vitest.config.ts          # Vitest unit test runner config
```

## WHERE TO LOOK
| Domain | Location | Key Files |
|--------|----------|-----------|
| Authentication | `src/modules/auth/` | `auth.service.ts`, `jwt.strategy.ts` |
| Projects | `src/modules/projects/` | `projects.controller.ts`, `projects.service.ts` |
| Issues | `src/modules/issues/` | `issues.service.ts`, `dto/create-issue.dto.ts` |
| Project Members | `src/modules/project-members/` | `project-members.controller.ts` |
| Common Guards | `src/common/guards/` | `project-member.guard.ts`, `jwt-auth.guard.ts` |

## CONVENTIONS
- Controller routes use decorator guards `@UseGuards(JwtAuthGuard, ProjectMemberGuard)`.
- Request user injected via `@CurrentUser('id')` custom decorator.
- Use `nestjs-prisma` or `PrismaService` for database queries.
- Format code via `npm run format` (Prettier, singleQuote: true, trailingComma: all).
- Unit test naming: `*.spec.ts`. Integration test naming: `*.integration.spec.ts`. E2E: `*.e2e-spec.ts`.

## ANTI-PATTERNS
- DO NOT manually write raw SQL when Prisma query builder covers the use case.
- DO NOT create new modules without registering them in `app.module.ts`.
- DO NOT suppress type checking with `any` or `@ts-ignore`.
