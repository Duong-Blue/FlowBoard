# flowboard-phase4-frontend - Work Plan

## TL;DR (For humans)

**What you'll get:** Frontend FlowBoard hoàn chỉnh cho Auth + Org + Project + Member management — giao diện Jira-inspired, kết nối thật với BE Phase 3 hiện có. Người dùng có thể đăng ký/đăng nhập, tạo tổ chức, quản lý project và thành viên, gửi/chấp nhận invitation.

**Why this approach:** Bám sát 100% BE endpoints đã có. Dùng Redux Toolkit cho global state (auth token, active org, active project) + axios singleton qua `api_helper.ts` cho tất cả HTTP calls. shadcn/ui trên Tailwind v4 đã có sẵn — zero new CSS framework.

**What it will NOT do:** Không có Issue/Sprint/Kanban board thật; không gửi email thật; không có unit test framework; `@dnd-kit` chỉ install sẵn, không dùng.

**Effort:** Large
**Risk:** Medium — shadcn/ui CLI cần compatible với Tailwind v4; test bằng `vite build` + browser thủ công.

**Decisions I made for you:**
- Redux Toolkit (user chọn) — `authSlice`, `orgSlice`, `projectSlice`
- axios + `src/utils/api_helper.ts` — interceptor tự attach Bearer token, auto-refresh 401
- shadcn/ui — component library Radix + Tailwind
- `@dnd-kit/core` install sẵn, chưa dùng
- `localStorage` lưu access token (upgrade httpOnly cookie khi cần)
- React Router v7 nested routes: `AuthLayout` (public) + `AppLayout` (protected)

Your next move: chạy `$start-work` để bắt đầu execution.

---

> TL;DR (machine): Large effort, Medium risk — full Jira-like Auth+Org+Project FE wired to existing BE Phase 3 API, Redux Toolkit + axios + shadcn/ui on React 19 + Vite 8 + Tailwind v4.

## Scope

### Must have
- `npm install axios @reduxjs/toolkit react-redux @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` trong `frontend/`
- shadcn/ui init (CLI hoặc thủ công copy components vào `src/components/ui/`)
- `src/utils/api_helper.ts` — axios instance, base URL `http://localhost:3000`, Bearer token interceptor, 401 auto-refresh
- Redux store: `authSlice` (user, accessToken, isAuthenticated), `orgSlice` (list, activeOrgId), `projectSlice` (list, activeProjectId)
- `AuthLayout` — public wrapper (login/register), redirect sang `/` nếu đã auth
- `AppLayout` — protected wrapper: sidebar Jira-style (org switcher, project nav), redirect `/login` nếu chưa auth
- Screens (12 màn hình):
  1. `/login` — Login form
  2. `/register` — Register form
  3. `/` — Org dashboard (danh sách org, chọn active org)
  4. `/orgs/new` — Create org form
  5. `/orgs/:orgId/settings` — Org settings (edit name/slug/desc, delete org)
  6. `/orgs/:orgId/members` — Org member list + role badge + change role + remove
  7. `/orgs/:orgId/invitations` — Invitation list + send invite form + revoke
  8. `/invitations/accept?token=...` — Accept invitation page
  9. `/orgs/:orgId/projects` — Project list cards
  10. `/orgs/:orgId/projects/new` — Create project form
  11. `/orgs/:orgId/projects/:projectId/settings` — Project settings (edit, delete)
  12. `/orgs/:orgId/projects/:projectId/members` — Project member list + add/role/remove

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Không implement Issue, Sprint, Board (BE chưa có model)
- Không dùng `@dnd-kit` trong bất kỳ component nào phase này (install sẵn thôi)
- Không thêm TanStack Query, React Query, SWR, hoặc bất kỳ server-state lib nào khác
- Không thêm testing framework (Jest, Vitest cho FE)
- Không email sending thật
- Không Next.js migration
- Không thêm component library nào khác ngoài shadcn/ui
- Không global error boundary phức tạp — toast đơn giản đủ

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: none (no test framework) — verification bằng `npm run build` (TypeScript compile + Vite bundle), plus screenshot evidence qua Playwright nếu available
- Evidence path: `.omo/evidence/phase4-frontend/`
- Build pass = zero TypeScript errors + bundle created

## Execution strategy

### Parallel execution waves

**Wave 1 — Foundation (sequential, blocks everything)**
- Install deps, shadcn/ui init, Redux store setup, api_helper.ts

**Wave 2 — Core infra (parallel)**
- Auth slices + AuthLayout + Login + Register pages
- App shell: AppLayout + sidebar + org switcher + routing skeleton

**Wave 3 — Org domain (parallel)**
- Org dashboard + Create org
- Org settings page
- Org members page

**Wave 4 — Invitation + Project domain (parallel)**
- Invitations page + Accept invitation page
- Project list + Create project

**Wave 5 — Project sub-pages (parallel)**
- Project settings page
- Project members page

**Wave 6 — Polish + Build verification (sequential)**
- Responsive layout check, error handling, `npm run build`

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
|------|-----------|--------|---------------------|
| 1. Install deps | — | everything | — |
| 2. shadcn/ui init | 1 | 3,4 | — |
| 3. api_helper.ts | 1 | 5,6,7,8,9,10,11,12,13 | 2 |
| 4. Redux store | 1 | 5,6 | 2,3 |
| 5. authSlice + AuthLayout | 3,4 | 6,7 | — |
| 6. Login + Register pages | 5 | — | 7 |
| 7. AppLayout + sidebar | 5 | 8,9,10,11,12,13 | 6 |
| 8. Org dashboard | 7,3 | — | 9,10 |
| 9. Org settings | 7,3 | — | 8,10 |
| 10. Org members | 7,3 | — | 8,9 |
| 11. Invitations | 7,3 | — | 12,13 |
| 12. Accept invitation | 3 | — | 11,13 |
| 13. Project list + create | 7,3 | 14,15 | 11,12 |
| 14. Project settings | 13 | — | 15 |
| 15. Project members | 13 | — | 14 |
| 16. Build + polish | all | — | — |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

- [x] 1. frontend/: Install axios, Redux Toolkit, react-redux, @dnd-kit packages
  What to do: Trong thư mục `D:/_FlowBoard/frontend/`, chạy `npm install axios @reduxjs/toolkit react-redux @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`. Sau đó verify `package.json` có đủ 5 packages mới.
  Must NOT do: Không install thêm bất kỳ package nào khác. Không xóa package cũ.
  Parallelization: Wave 1 | Blocked by: — | Blocks: tất cả todos còn lại
  References: `frontend/package.json:1-28`
  Acceptance criteria: `cat frontend/package.json` hiển thị `axios`, `@reduxjs/toolkit`, `react-redux`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` trong dependencies. `npm install` exit code 0.
  QA scenarios: happy — package.json chứa 6 packages mới; failure — nếu npm error, đọc error message và fix (thường do node version hoặc peer dep).
  Evidence: `.omo/evidence/phase4-frontend/task-1-install.txt` — output của `npm list axios @reduxjs/toolkit react-redux`
  Commit: Y | `chore(frontend): install axios, redux-toolkit, react-redux, dnd-kit`

- [x] 2. frontend/src/components/ui/: Setup shadcn/ui components thủ công (Button, Input, Label, Card, Badge, Dialog, DropdownMenu, Toast/Sonner, Avatar, Separator)
  What to do: shadcn/ui CLI có thể không compatible hoàn toàn với Tailwind v4. Approach thủ công: (a) Install Radix UI primitives cần thiết: `npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-avatar @radix-ui/react-separator @radix-ui/react-slot sonner lucide-react class-variance-authority clsx tailwind-merge`. (b) Tạo `frontend/src/lib/utils.ts` với `cn()` helper (clsx + tailwind-merge). (c) Copy/tạo thủ công từng component vào `frontend/src/components/ui/`: `button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`, `badge.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `avatar.tsx`, `separator.tsx`. Dùng shadcn/ui source tại https://ui.shadcn.com/docs/components — copy nguyên văn source TypeScript, điều chỉnh import paths. (d) Tạo `frontend/src/components/ui/toaster.tsx` dùng `sonner`.
  Must NOT do: Không dùng `shadcn@latest init` nếu nó fail — thủ công là fallback. Không tạo component nào không có trong danh sách trên.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: tất cả UI todos
  References: `frontend/src/index.css:1` (đã có `@import "tailwindcss"`), `frontend/vite.config.ts`
  Acceptance criteria: `frontend/src/components/ui/button.tsx` tồn tại và export `Button`. `frontend/src/lib/utils.ts` export `cn`. TypeScript không báo lỗi import.
  QA scenarios: happy — `npm run build` sau bước này không lỗi; failure — nếu Tailwind v4 class không apply, kiểm tra `index.css` có `@import "tailwindcss"`.
  Evidence: `.omo/evidence/phase4-frontend/task-2-shadcn.txt` — list files trong `src/components/ui/`
  Commit: Y | `feat(frontend): add shadcn-compatible ui components (button, input, card, dialog, badge, avatar)`

- [x] 3. frontend/src/utils/api_helper.ts: Tạo axios singleton với auth interceptors
  What to do: Tạo file `frontend/src/utils/api_helper.ts`. Nội dung: (a) Tạo axios instance với `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000'`, `timeout: 10000`. (b) Request interceptor: đọc `localStorage.getItem('accessToken')`, nếu có thì set `Authorization: Bearer <token>`. (c) Response interceptor 401: gọi `POST /auth/refresh` với `{ refreshToken: localStorage.getItem('refreshToken') }`, lưu token mới vào localStorage, retry request gốc. Nếu refresh cũng fail → xóa tokens, redirect `/login`. (d) Export các typed helper functions: `apiGet<T>(url, params?)`, `apiPost<T>(url, data?)`, `apiPatch<T>(url, data?)`, `apiDelete<T>(url)`. (e) Tạo `frontend/src/.env.example` → `VITE_API_URL=http://localhost:3000`.
  Must NOT do: Không dùng `fetch` native. Không để raw axios calls rải rác trong components — mọi thứ qua api_helper. Không hardcode URL (dùng env var).
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: tất cả service/page todos
  References: BE endpoints: `POST /auth/refresh` (body: `{ refreshToken }`), response: `{ accessToken, refreshToken }`
  Acceptance criteria: File tồn tại, export `apiGet`, `apiPost`, `apiPatch`, `apiDelete`. TypeScript types đúng (không có `any` raw).
  QA scenarios: happy — import `apiGet` trong một component khác không lỗi TypeScript; failure — nếu 401 loop, kiểm tra refresh endpoint BE trả về gì.
  Evidence: `.omo/evidence/phase4-frontend/task-3-api-helper.ts` — copy nội dung file
  Commit: Y | `feat(frontend): add axios api_helper with auth interceptors`

- [x] 4. frontend/src/store/: Tạo Redux store với authSlice, orgSlice, projectSlice
  What to do: (a) Tạo `frontend/src/store/index.ts` — configure Redux store, export `RootState`, `AppDispatch`, typed `useAppSelector`, `useAppDispatch` hooks. (b) `frontend/src/store/slices/authSlice.ts`: state = `{ user: User | null, accessToken: string | null, isAuthenticated: boolean }`. Actions: `setCredentials(user, accessToken)`, `logout()`. Thunk `refreshTokenThunk` nếu cần. (c) `frontend/src/store/slices/orgSlice.ts`: state = `{ list: Organization[], activeOrgId: string | null, loading: boolean }`. Actions: `setOrgs`, `setActiveOrg`, `addOrg`, `removeOrg`, `updateOrg`. (d) `frontend/src/store/slices/projectSlice.ts`: state = `{ list: Project[], activeProjectId: string | null, loading: boolean }`. Actions: `setProjects`, `setActiveProject`, `addProject`, `removeProject`, `updateProject`. (e) `frontend/src/store/types.ts`: TypeScript interfaces `User`, `Organization`, `Project`, `OrgMember`, `ProjectMember`, `Invitation` — bám sát Prisma models từ BE. (f) Wrap `<App />` trong `main.tsx` với `<Provider store={store}>`. (g) `frontend/src/store/slices/authSlice.ts`: persist `accessToken` + `refreshToken` vào localStorage trong reducer.
  Must NOT do: Không dùng `redux-persist` lib — tự persist thủ công qua localStorage trong reducer. Không tạo slice cho entities chưa có BE (Issue, Sprint).
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 5,6,7
  References: Prisma models từ BE survey: User (id, email, firstName, lastName, displayName, avatarUrl), Organization (id, name, slug, description, logoUrl), Project (id, name, key, description, status, organizationId), OrgRole enum: OWNER/ADMIN/MEMBER, ProjectRole enum: ADMIN/MEMBER/VIEWER
  Acceptance criteria: `src/store/index.ts` export `store`. `main.tsx` wrap Provider. TypeScript không báo lỗi. `npm run build` pass.
  QA scenarios: happy — `useAppSelector(s => s.auth.isAuthenticated)` trong bất kỳ component nào không lỗi; failure — nếu circular import, tách types ra file riêng.
  Evidence: `.omo/evidence/phase4-frontend/task-4-store.txt` — output `npm run build` (exit 0)
  Commit: Y | `feat(frontend): add redux store with authSlice, orgSlice, projectSlice`

- [x] 5. frontend/src/layouts/ + frontend/src/App.tsx: Tạo AuthLayout, AppLayout, cập nhật router
  What to do: (a) `frontend/src/layouts/AuthLayout.tsx`: check `isAuthenticated` từ Redux store — nếu true, redirect `<Navigate to="/" />`. Render `<Outlet />` centered (login/register form giữa màn hình, Jira-style dark sidebar bên trái với logo). (b) `frontend/src/layouts/AppLayout.tsx`: check `isAuthenticated` — nếu false, redirect `<Navigate to="/login" />`. Layout 2 cột: sidebar cố định trái (width 240px) + main content bên phải. Sidebar chứa: logo FlowBoard, org switcher dropdown (danh sách orgs từ Redux), "Create org" link, divider, danh sách projects của active org, settings link. Header top bar: tên org active, avatar + dropdown user (logout). (c) Cập nhật `frontend/src/App.tsx`: router cấu trúc mới — `AuthLayout` bọc `/login`, `/register`, `/invitations/accept`; `AppLayout` bọc tất cả routes còn lại. Lazy import các page components (chưa tồn tại thì để placeholder `<div>TODO</div>` tạm).
  Must NOT do: Không đặt business logic trong layout — chỉ shell + redirect. Không fetch data trong layout component (fetch ở pages).
  Parallelization: Wave 2 | Blocked by: 4 | Blocks: 6,7,8,9,10,11,12,13,14,15
  References: `frontend/src/App.tsx:1-20`, `frontend/src/layouts/RootLayout.tsx:1-20`, `frontend/src/store/slices/authSlice.ts`
  Acceptance criteria: Navigate tới `/` khi chưa login → redirect `/login`. Navigate tới `/login` khi đã login → redirect `/`. AppLayout render sidebar. TypeScript no errors.
  QA scenarios: happy — `npm run build` pass; failure — nếu circular dep giữa layout và store, dùng lazy import.
  Evidence: `.omo/evidence/phase4-frontend/task-5-layouts.txt`
  Commit: Y | `feat(frontend): add AuthLayout, AppLayout, update router structure`

- [x] 6. frontend/src/pages/auth/: Login page + Register page
  What to do: (a) `frontend/src/pages/auth/LoginPage.tsx`: Form 2 field (email, password). Submit gọi `apiPost<{ accessToken, refreshToken, user }>('/auth/login', { email, password })`. Success → dispatch `setCredentials`, lưu tokens localStorage, navigate `/`. Error → hiển thị toast error. Dùng shadcn `Button`, `Input`, `Label`, `Card`. Link "Chưa có tài khoản? Đăng ký". (b) `frontend/src/pages/auth/RegisterPage.tsx`: Form 4 field (firstName, lastName, email, password). Submit gọi `apiPost('/auth/register', dto)`. Success → auto-login (gọi login luôn hoặc redirect `/login` với toast success). (c) `frontend/src/components/ui/toaster.tsx` render `<Toaster />` từ sonner trong `main.tsx` hoặc `AppLayout`. (d) Cả 2 pages: loading state trên button khi đang submit.
  Must NOT do: Không validate phức tạp (chỉ required + email format đơn giản). Không dùng react-hook-form — useState đủ.
  Parallelization: Wave 2 | Blocked by: 5 | Blocks: —
  References: BE endpoint `POST /auth/login` body `{ email, password }` response `{ accessToken, refreshToken, user: { id, email, firstName, lastName, ... } }`. `POST /auth/register` body `{ email, password, firstName, lastName }`. `frontend/src/utils/api_helper.ts`, `frontend/src/store/slices/authSlice.ts`
  Acceptance criteria: Login với credentials hợp lệ → redirect `/`. Login sai → toast "Invalid credentials". Register → redirect hoặc toast success.
  QA scenarios: happy — đăng nhập thành công, localStorage có `accessToken`; failure — BE down → toast error "Network error".
  Evidence: `.omo/evidence/phase4-frontend/task-6-auth-pages.txt`
  Commit: Y | `feat(frontend): add login and register pages`

- [x] 7. frontend/src/services/: Tạo service layer (orgService, projectService, memberService, invitationService)
  What to do: Mỗi service là một file TypeScript module export plain functions dùng `api_helper`. (a) `frontend/src/services/orgService.ts`: `getOrgs()`, `createOrg(dto)`, `getOrg(orgId)`, `updateOrg(orgId, dto)`, `deleteOrg(orgId)`. (b) `frontend/src/services/memberService.ts`: `getOrgMembers(orgId)`, `updateOrgMemberRole(orgId, userId, role)`, `removeOrgMember(orgId, userId)`, `getProjectMembers(projectId)`, `addProjectMember(projectId, dto)`, `updateProjectMemberRole(projectId, userId, role)`, `removeProjectMember(projectId, userId)`. (c) `frontend/src/services/invitationService.ts`: `getInvitations(orgId)`, `sendInvitation(orgId, dto)`, `revokeInvitation(orgId, id)`, `acceptInvitation(orgId, token)`. (d) `frontend/src/services/projectService.ts`: `getProjects(orgId)`, `createProject(orgId, dto)`, `getProject(orgId, id)`, `updateProject(orgId, id, dto)`, `deleteProject(orgId, id)`. Tất cả return typed Promise dùng interfaces từ `store/types.ts`.
  Must NOT do: Không đặt fetch logic trong components hay Redux thunks — mọi thứ qua service layer. Không thêm caching (không phải TanStack Query).
  Parallelization: Wave 2 | Blocked by: 3,4 | Blocks: 8,9,10,11,12,13,14,15
  References: BE endpoints table từ survey: `/organizations`, `/organizations/:orgId/members`, `/organizations/:orgId/invitations`, `/organizations/:orgId/projects`, `/projects/:projectId/members`. `frontend/src/utils/api_helper.ts`, `frontend/src/store/types.ts`
  Acceptance criteria: TypeScript compile không lỗi. Mỗi function có return type rõ ràng. `npm run build` pass.
  QA scenarios: happy — import `orgService` trong OrgDashboard không lỗi; failure — nếu path mismatch với BE, đối chiếu lại endpoint table.
  Evidence: `.omo/evidence/phase4-frontend/task-7-services.txt` — list files + `npm run build` exit 0
  Commit: Y | `feat(frontend): add service layer (org, project, member, invitation)`

- [x] 8. frontend/src/pages/orgs/OrgDashboard.tsx + CreateOrgPage.tsx
  What to do: (a) `OrgDashboard.tsx` (route `/`): mount → `orgService.getOrgs()` → dispatch `setOrgs`. Hiển thị grid cards tổ chức (như Jira's team picker): mỗi card có logo/avatar initials, tên, slug, số members (nếu có). Click card → dispatch `setActiveOrg(id)`, navigate `/orgs/:orgId/projects`. Button "+ New Organization" → navigate `/orgs/new`. Nếu list rỗng → empty state "No organizations yet, create one". Loading skeleton khi fetch. (b) `CreateOrgPage.tsx` (route `/orgs/new`): Form — name (required), slug (auto-generate từ name, editable), description (optional). Submit `orgService.createOrg(dto)` → dispatch `addOrg`, navigate `/orgs/:newId/projects`. Cancel → navigate `/`.
  Must NOT do: Không fetch members trong trang này (chưa cần). Không pagination (scope này).
  Parallelization: Wave 3 | Blocked by: 5,7 | Blocks: — | Can parallelize with: 9,10
  References: `orgService.getOrgs()`, `orgService.createOrg(dto)`, `frontend/src/store/slices/orgSlice.ts`
  Acceptance criteria: Trang `/` sau login hiển thị danh sách orgs. Click org → navigate đúng route. Create org → org mới xuất hiện và redirect.
  QA scenarios: happy — tạo org mới, redirect đúng; failure — API error → toast.
  Evidence: `.omo/evidence/phase4-frontend/task-8-org-dashboard.txt`
  Commit: Y | `feat(frontend): add org dashboard and create org page`

- [x] 9. frontend/src/pages/orgs/OrgSettingsPage.tsx
  What to do: Route `/orgs/:orgId/settings`. Load org hiện tại từ Redux (activeOrgId) hoặc fetch `orgService.getOrg(orgId)`. Form edit: name, description, logoUrl (text input URL). Submit → `orgService.updateOrg(orgId, dto)` → dispatch `updateOrg`, toast success. Section "Danger Zone": button "Delete Organization" → confirm dialog (shadcn `Dialog`) → `orgService.deleteOrg(orgId)` → dispatch `removeOrg` → navigate `/`. Chỉ OWNER mới thấy Danger Zone — check role từ members (fetch `memberService.getOrgMembers(orgId)`, tìm current user). Badge hiển thị role hiện tại của user.
  Must NOT do: Không cho non-OWNER xóa org (check FE + BE sẽ trả 403). Không xóa mà không confirm dialog.
  Parallelization: Wave 3 | Blocked by: 5,7 | Blocks: — | Can parallelize with: 8,10
  References: `orgService.updateOrg`, `orgService.deleteOrg`, `memberService.getOrgMembers`, BE endpoint `DELETE /organizations/:orgId` chỉ OWNER mới được
  Acceptance criteria: Edit org → thay đổi persist sau reload (fetch lại). Delete → confirm dialog xuất hiện, sau confirm → redirect `/`.
  QA scenarios: happy — OWNER xóa org thành công; failure — MEMBER click delete → 403 toast.
  Evidence: `.omo/evidence/phase4-frontend/task-9-org-settings.txt`
  Commit: Y | `feat(frontend): add org settings page with delete confirmation`

- [x] 10. frontend/src/pages/orgs/OrgMembersPage.tsx
  What to do: Route `/orgs/:orgId/members`. Fetch `memberService.getOrgMembers(orgId)`. Hiển thị table/list: avatar initials, displayName hoặc `${firstName} ${lastName}`, email, role badge (color-coded: OWNER=purple, ADMIN=blue, MEMBER=gray). Actions (chỉ OWNER/ADMIN thấy): dropdown role (ADMIN, MEMBER) → `memberService.updateOrgMemberRole(orgId, userId, role)`. Button remove → confirm inline hoặc dialog → `memberService.removeOrgMember(orgId, userId)`. Current user không thể remove chính mình. OWNER không thể bị downgrade (FE guard). Loading skeleton. Empty state nếu 0 members (không nên xảy ra vì luôn có OWNER).
  Must NOT do: Không hiển thị invite form ở đây — invite có trang riêng. Không cho MEMBER thấy action buttons.
  Parallelization: Wave 3 | Blocked by: 5,7 | Blocks: — | Can parallelize with: 8,9
  References: `memberService.getOrgMembers(orgId)`, `memberService.updateOrgMemberRole`, `memberService.removeOrgMember`, BE endpoint `GET /organizations/:orgId/members`, `PATCH /organizations/:orgId/members/:userId`, `DELETE /organizations/:orgId/members/:userId`
  Acceptance criteria: List members hiển thị đúng. OWNER thấy role dropdown + remove. MEMBER không thấy actions.
  QA scenarios: happy — ADMIN đổi role MEMBER thành công; failure — 403 → toast error.
  Evidence: `.omo/evidence/phase4-frontend/task-10-org-members.txt`
  Commit: Y | `feat(frontend): add org members management page`

- [x] 11. frontend/src/pages/invitations/: InvitationsPage.tsx + AcceptInvitationPage.tsx
  What to do: (a) `InvitationsPage.tsx` (route `/orgs/:orgId/invitations`): Section 1 "Pending Invitations" — fetch `invitationService.getInvitations(orgId)`, list: email, role, expires date, status badge. Button "Revoke" → `invitationService.revokeInvitation(orgId, id)` → refresh list. Section 2 "Invite Member" — form: email (required), role select (ADMIN/MEMBER, default MEMBER). Submit → `invitationService.sendInvitation(orgId, { email, role })` → toast "Invitation sent". Chỉ OWNER/ADMIN thấy invite form. (b) `AcceptInvitationPage.tsx` (route `/invitations/accept`): public route (trong AuthLayout hoặc standalone). Đọc `?token=` từ query string. Nếu chưa login → redirect `/login?redirect=/invitations/accept?token=...`. Nếu đã login → hiển thị "Join Organization" button → gọi `invitationService.acceptInvitation(orgId, token)`. Vấn đề: cần `orgId` — lấy từ query param `?orgId=...&token=...` hoặc decode token (nếu BE trả orgId trong invitation info endpoint). Sau accept → navigate `/`.
  Must NOT do: Không gửi email thật — chỉ hiển thị token/link để copy. Không auto-accept khi vào trang (luôn confirm button).
  Parallelization: Wave 4 | Blocked by: 5,7 | Blocks: — | Can parallelize with: 12,13
  References: `invitationService.getInvitations`, `invitationService.sendInvitation`, `invitationService.revokeInvitation`, `invitationService.acceptInvitation`, BE `POST /organizations/:orgId/invitations/accept` body `{ token }`. AcceptInvitationPage cần `orgId` từ URL query param — worker cần kiểm tra thực tế BE có endpoint lấy info invitation từ token không; nếu không có thì truyền orgId qua query param khi copy link.
  Acceptance criteria: ADMIN gửi invite → xuất hiện trong pending list. Revoke → disappear. Accept invitation page hiển thị button và gọi đúng API.
  QA scenarios: happy — send invite → pending list cập nhật; failure — expired token → BE 400 → toast error.
  Evidence: `.omo/evidence/phase4-frontend/task-11-invitations.txt`
  Commit: Y | `feat(frontend): add invitations management and accept invitation pages`

- [x] 12. frontend/src/pages/projects/ProjectListPage.tsx + CreateProjectPage.tsx
  What to do: (a) `ProjectListPage.tsx` (route `/orgs/:orgId/projects`): mount → fetch `projectService.getProjects(orgId)` → dispatch `setProjects`. Hiển thị grid cards kiểu Jira project browser: project key badge (e.g. "FLOW"), name, description, status badge (ACTIVE=green, ARCHIVED=gray). Click → navigate `/orgs/:orgId/projects/:projectId/members` (phase này chưa có board). Button "+ Create Project". (b) `CreateProjectPage.tsx` (route `/orgs/:orgId/projects/new`): Form: name (required), key (auto-generate uppercase 2-6 chars từ name, editable, unique per org — BE enforce), description. Submit → `projectService.createProject(orgId, dto)` → dispatch `addProject` → navigate `/orgs/:orgId/projects/:newId/members`. Cancel → navigate back.
  Must NOT do: Không navigate sang board page (chưa có). Không pagination.
  Parallelization: Wave 4 | Blocked by: 5,7 | Blocks: 13,14 | Can parallelize with: 11
  References: `projectService.getProjects`, `projectService.createProject`, `frontend/src/store/slices/projectSlice.ts`, BE `GET /organizations/:orgId/projects`, `POST /organizations/:orgId/projects` body `{ name, key, description? }`
  Acceptance criteria: Project list hiển thị đúng. Tạo project → redirect đúng. Key unique conflict → toast BE error.
  QA scenarios: happy — tạo project "FlowBoard" key "FLOW" thành công; failure — duplicate key → 400 toast.
  Evidence: `.omo/evidence/phase4-frontend/task-12-project-pages.txt`
  Commit: Y | `feat(frontend): add project list and create project pages`

- [x] 13. frontend/src/pages/projects/ProjectSettingsPage.tsx
  What to do: Route `/orgs/:orgId/projects/:projectId/settings`. Fetch `projectService.getProject(orgId, projectId)`. Form: name, description, status (select: ACTIVE/ARCHIVED). Submit → `projectService.updateProject(orgId, projectId, dto)` → dispatch `updateProject`, toast. Danger Zone: "Archive Project" (status → ARCHIVED) + "Delete Project" với confirm dialog → `projectService.deleteProject(orgId, projectId)` → dispatch `removeProject` → navigate `/orgs/:orgId/projects`. Chỉ project ADMIN thấy Danger Zone — check từ `memberService.getProjectMembers(projectId)`.
  Must NOT do: Không xóa không confirm. Không cho MEMBER/VIEWER xóa (FE guard + BE 403).
  Parallelization: Wave 5 | Blocked by: 12 | Blocks: — | Can parallelize with: 14
  References: `projectService.updateProject`, `projectService.deleteProject`, `memberService.getProjectMembers`, BE `PATCH /organizations/:orgId/projects/:id`, `DELETE /organizations/:orgId/projects/:id`
  Acceptance criteria: Edit project name → persist. Delete → confirm → redirect. Archive → status badge đổi.
  QA scenarios: happy — ADMIN delete project, redirect đúng; failure — MEMBER truy cập → 403 toast.
  Evidence: `.omo/evidence/phase4-frontend/task-13-project-settings.txt`
  Commit: Y | `feat(frontend): add project settings page`

- [x] 14. frontend/src/pages/projects/ProjectMembersPage.tsx
  What to do: Route `/orgs/:orgId/projects/:projectId/members`. Fetch `memberService.getProjectMembers(projectId)`. Hiển thị: avatar, name, email, role badge (ADMIN=blue, MEMBER=gray, VIEWER=outline). Actions (chỉ ADMIN): add member — form email + role (BE cần userId, không phải email — worker cần figure out: có thể dùng org member list làm source, select từ dropdown org members chưa trong project). Role change dropdown. Remove button → confirm. Section "Add Member": fetch org members → filter ra những ai chưa trong project → dropdown select + role select → `memberService.addProjectMember(projectId, { userId, role })`. Loading state. Current user không thể tự remove.
  Must NOT do: Không add member bằng email trực tiếp (BE nhận userId) — dùng org member list làm source.
  Parallelization: Wave 5 | Blocked by: 12 | Blocks: — | Can parallelize with: 13
  References: `memberService.getProjectMembers(projectId)`, `memberService.addProjectMember(projectId, dto)`, `memberService.updateProjectMemberRole`, `memberService.removeProjectMember`, `memberService.getOrgMembers(orgId)`, BE `GET /projects/:projectId/members`, `POST /projects/:projectId/members` body `{ userId, role }`, `PATCH /projects/:projectId/members/:userId` body `{ role }`, `DELETE /projects/:projectId/members/:userId`
  Acceptance criteria: Add org member vào project → xuất hiện trong list. Remove → disappear. Role change → persist.
  QA scenarios: happy — ADMIN add VIEWER thành công; failure — userId không tồn tại → 404 toast.
  Evidence: `.omo/evidence/phase4-frontend/task-14-project-members.txt`
  Commit: Y | `feat(frontend): add project members management page`

- [x] 15. frontend/src/: Polish — sidebar active state, breadcrumb, logout, .env.example, responsive
  What to do: (a) Sidebar: highlight active org, active project bằng bg color + font-semibold. (b) Logout: dispatch `logout()`, clear localStorage tokens, gọi `apiPost('/auth/logout', { refreshToken })`, navigate `/login`. (c) User avatar dropdown trong header: hiển thị `displayName || firstName`, avatar initials, link "Profile" (placeholder), "Sign out". (d) Tạo `frontend/.env.example`: `VITE_API_URL=http://localhost:3000`. (e) AppLayout responsive: trên mobile sidebar collapse (hamburger menu). Trên desktop sidebar cố định. (f) Page titles: mỗi page set `document.title = "FlowBoard - <PageName>"`. (g) 404 NotFound page update cho phù hợp với AppLayout (hiện tại chỉ có plain text). (h) Global error toast: nếu `api_helper` response interceptor catch lỗi không phải 401, show `sonner` toast với message từ BE response.
  Must NOT do: Không thêm mobile bottom navigation (out of scope). Không animation phức tạp.
  Parallelization: Wave 6 | Blocked by: tất cả pages | Blocks: 16
  References: `frontend/src/layouts/AppLayout.tsx`, `frontend/src/store/slices/authSlice.ts`, `frontend/src/utils/api_helper.ts`
  Acceptance criteria: Logout xóa token, redirect login. Sidebar highlight đúng route active. `.env.example` tồn tại.
  QA scenarios: happy — logout → localStorage empty, redirect `/login`; failure — refresh token expired → cũng logout clean.
  Evidence: `.omo/evidence/phase4-frontend/task-15-polish.txt`
  Commit: Y | `feat(frontend): sidebar polish, logout flow, responsive layout, env example`

- [x] 16. frontend/: Final build verification — npm run build pass, no TypeScript errors
  What to do: (a) Chạy `cd frontend && npm run build` (= `tsc -b && vite build`). (b) Fix mọi TypeScript error nếu có (không dùng `@ts-ignore` trừ trường hợp bất khả kháng). (c) Chạy `npm run lint` (oxlint) và fix warnings nghiêm trọng. (d) Kiểm tra `dist/` được tạo ra với `index.html` và các JS/CSS chunk. (e) Commit final.
  Must NOT do: Không ship với TypeScript errors. Không comment out code để pass build.
  Parallelization: Wave 6 | Blocked by: 15 | Blocks: —
  References: `frontend/package.json:8` (`"build": "tsc -b && vite build"`), `frontend/tsconfig.app.json`
  Acceptance criteria: `npm run build` exit code 0. `dist/index.html` tồn tại. Zero TypeScript errors in output.
  QA scenarios: happy — build pass, dist/ có files; failure — TypeScript error → đọc error, fix file liên quan.
  Evidence: `.omo/evidence/phase4-frontend/task-16-build.txt` — full output của `npm run build`
  Commit: Y | `chore(frontend): verify production build passes`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.

- [x] F1. Plan compliance audit — verify tất cả 16 todos đã được thực hiện đúng theo spec: check commit history, check file list `src/pages/`, `src/store/`, `src/services/`, `src/utils/api_helper.ts` tồn tại. Verify không có implementation bị thiếu.
- [x] F2. Build quality review — chạy lại `npm run build` từ clean state (`rm -rf dist/`), verify exit 0, không warning TypeScript, bundle size hợp lý (< 2MB).
- [x] F3. Real manual QA — khởi động BE + FE, chạy flow: register → login → create org → invite member → accept invite → create project → add project member → logout. Mỗi bước verify response BE 200/201.
- [x] F4. Scope fidelity — verify Must NOT have: không có Issue/Sprint/Kanban code, không có `@dnd-kit` import trong components (chỉ trong package.json), không có test files, không có TanStack Query import.

## Commit strategy
- Mỗi todo commit riêng với conventional commit format
- Cuối phase: `git tag v0.4.0-frontend`

## Success criteria
1. `npm run build` trong `frontend/` exit 0, zero TypeScript errors
2. Tất cả 12 screens navigate được và connect BE thật
3. Auth flow hoàn chỉnh: register → login → logout → token refresh tự động
4. Org + Project CRUD hoàn chỉnh qua UI
5. Member management (org + project) hoạt động
6. Invitation flow: send → pending list → accept → member xuất hiện
7. Redux store giữ state đúng qua navigation
8. `src/utils/api_helper.ts` là điểm duy nhất gọi axios
