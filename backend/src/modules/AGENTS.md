# BACKEND MODULES ARCHITECTURE

## OVERVIEW
Domain-driven NestJS modules for FlowBoard business logic.

## STRUCTURE
```
modules/
├── activity/          # Audit logs & issue activity history
├── auth/              # Registration, login, JWT token issuance & refresh
├── comments/          # Issue comments & discussions
├── health/            # Healthcheck API endpoint (/api/health)
├── invitations/       # Organization & project invitation links
├── issues/            # Issue CRUD, state transitions, DnD ordering
├── org-members/       # Organization membership management & roles
├── organizations/     # Organization CRUD & settings
├── project-members/   # Project-level permissions & member roles
├── projects/          # Project CRUD & key management
└── users/             # User profile management
```

## WHERE TO LOOK
| Action | Module | Notes |
|--------|--------|-------|
| Drag-and-drop order updates | `issues/` | Uses `fractional-indexing` for `lexorank` position strings |
| Project access control | `project-members/` | Checked by `ProjectMemberGuard` |
| Organization scope | `organizations/` | Base route `/organizations/:orgId/...` |

## CONVENTIONS
- Standard DTO location: `modules/<domain>/dto/<action>-<domain>.dto.ts`.
- Legacy note: `organizations`, `org-members`, `project-members` have DTO files directly at module root; new DTOs MUST go in `dto/` subfolders.
- Every module exports a `<Domain>Module` class importing its controller and service.
