# 04 — Plans HTTP controllers

Status: implemented
Scope: `src/infra/http/task-manager` (Plan routes only) and `api/STATUS.md`
Created: 2026-09-01

## Context

Plans are the last Task Manager domain with **no HTTP layer at all**. Domain,
Prisma persistence, and unit coverage are complete, but no controller, DTO, or
presenter exists, and none of the five Plan use cases is registered in
`TaskManagerModule` — this is what separates Plans from Work Logs, which only
needed refinement in `docs/specs/02-work-logs-http-contract-refinement.md`.

This spec delivers the six Plan routes already in the `STATUS.md` contract,
built from the start at the standard the previous three specs established:
`{ data }` envelope, uniform `404` for ownership, `PATCH` for partial edits, a
focused schedule route, Swagger, and one DTO file plus one controller file per
route. No use case, repository, mapper, Prisma schema, or migration changes. No
Task, Category, Work Log, or Identity file is touched.

## How Plans differ from Work Logs

These are the ressalvas that must not be copied over blindly from spec 02:

- **No timezone on the write routes.** A Plan is intended time: it may be in the
  future and may cross midnight. `CreatePlanUseCase` and `EditPlanUseCase`
  enforce only `endsAt > startsAt`. `timeZone` appears on exactly one route,
  `record-as-done`, which is the moment intended time becomes completed work.
- **No overlap rule.** Plans may overlap each other freely; only the Work Log
  created by `record-as-done` is checked against existing Work Logs.
- **`PlanData` has no `createdAt`/`updatedAt`** and carries `confirmedAt`
  instead, so `PlanDto` is not a copy of `WorkLogDto`.
- **A sixth route exists**, `record-as-done`, with an error the other domains do
  not have (`PlanAlreadyConfirmedError`) and no returnable resource.
- **Nothing is wired yet**: the five use cases must be added as providers, not
  just the controllers.

## Routes

| Route | Status | Body / query |
| --- | --- | --- |
| `GET /api/plans` | `200` | required `from`/`to`, optional `taskId`, `categoryId`, `withoutTask`, `withoutCategory` |
| `POST /api/plans` | `201` | `title`, optional `description`, `startsAt`, `endsAt`, optional `taskId`/`categoryId` |
| `PATCH /api/plans/:planId` | `204` | every field optional; `taskId`/`categoryId`/`description` nullable |
| `PATCH /api/plans/:planId/schedule` | `204` | optional `startsAt`/`endsAt` |
| `DELETE /api/plans/:planId` | `204` | — |
| `POST /api/plans/:planId/record-as-done` | `204` | required `timeZone` |

## Deliverables

### 1. Shared DTOs and presenter

- `dtos/plan.dto.ts`: `PlanDto` with `id`, `task`, `category`, `title`,
  `description`, `startsAt`, `endsAt`, `confirmedAt`, decorated with
  `@ApiProperty` like `WorkLogDto`. It mirrors the `PlanData` value object, so
  it has no `createdAt`/`updatedAt`.
- `dtos/created-plan.dto.ts`: `CreatedPlanDto` with `id`, `taskId`,
  `categoryId`, `title`, `description`, `startsAt`, `endsAt`, `confirmedAt`,
  `createdAt`, `updatedAt`. `CreatePlanUseCase` returns the `Plan` entity, which
  carries the raw ids and no relation summaries — the same reasoning that
  produced `CreatedWorkLogDto` in spec 02.
- `presenters/plan-presenter.ts`: `PlanPresenter.toHTTP(plan: PlanData)` and
  `PlanPresenter.toHTTPCreated(plan: Plan)`, mirroring `WorkLogPresenter`.

### 2. `GET /api/plans`

- `dto/fetch-plans.dto.ts`: `from`/`to` required ISO datetimes transformed into
  `Date`; `taskId`/`categoryId` accepting one value or many and normalized to an
  array; `withoutTask`/`withoutCategory` as `'true'` string flags — the same
  shape as `fetch-work-logs.dto.ts`. Plus `FetchPlansResponseDto`.
- `fetch-plans.controller.ts`: delegates to `FetchPlansUseCase`, maps
  `InvalidDatetimeError` to `400` **carrying the use-case message**, and returns
  `{ data: plans.map(PlanPresenter.toHTTP) }`.

The repository already orders by `startsAt` and builds OR-within-facet /
AND-between-facet filters, so no filtering logic belongs in the controller.

### 3. `POST /api/plans`

- `dto/create-plan.dto.ts`: `title` (1–255), optional `description` (max 1000),
  required `startsAt`/`endsAt`, optional `taskId`/`categoryId` as UUIDs; plus
  `CreatePlanResponseDto` exposing `data: CreatedPlanDto`.
- `create-plan.controller.ts`: `201` returning
  `{ data: PlanPresenter.toHTTPCreated(plan) }`; `InvalidDatetimeError` → `400`;
  `ResourceNotFoundError` / `NotAllowedError` → `404 Plan relation not found`,
  because there both report a missing or foreign referenced Task or Category,
  never a missing Plan — the same distinction spec 02 drew for Work Logs.

### 4. `PATCH /api/plans/:planId`

- `dto/edit-plan.dto.ts`: param schema with `planId` UUID; body with `title`,
  `description`, `taskId`, `categoryId`, `startsAt`, `endsAt`, all optional and
  the first four nullable, matching `EditPlanUseCase`'s `!== undefined` checks
  that distinguish "keep" from "clear".
- `edit-plan.controller.ts`: `204`; `InvalidDatetimeError` → `400`;
  `ResourceNotFoundError` / `NotAllowedError` → `404 Plan not found`.

Note the domain limitation to respect: `EditPlanUseCase` only validates a
referenced Task or Category when the id is truthy, so `null` clears the relation
without a lookup. The controller forwards `null` unchanged and adds no rules.

### 5. `PATCH /api/plans/:planId/schedule`

- `dto/edit-plan-schedule.dto.ts`: param schema plus optional `startsAt` and
  `endsAt`. **No `timeZone` and no nullable dates** — a Plan always has an
  interval, and no calendar-day rule applies.
- `edit-plan-schedule.controller.ts`: reuses `EditPlanUseCase` with only the two
  dates, `204`, same error mapping as the edit route.

### 6. `DELETE /api/plans/:planId`

- `dto/delete-plan.dto.ts`: param schema with `planId` UUID.
- `delete-plan.controller.ts`: `204`, `404 Plan not found` for both errors.

### 7. `POST /api/plans/:planId/record-as-done`

- `dto/confirm-plan.dto.ts`: param schema plus a required `timeZone`
  (1–255 chars), the only Plan route that takes one.
- `confirm-plan.controller.ts`: delegates to `ConfirmPlanUseCase` and maps:
  - `ResourceNotFoundError` / `NotAllowedError` → `404 Plan not found`;
  - `PlanAlreadyConfirmedError` → `409`, a state conflict rather than a
    malformed request; `ConflictException` already has precedent in
    `register.controller.ts`;
  - `InvalidDatetimeError` / `InvalidTimeZoneError` → `400` with the message.

**Response is `204`, not `201`.** `ConfirmPlanUseCase` returns `null`, so there
is no Work Log to present. Returning the created Work Log would require changing
the use-case response type, which is out of scope here; it is recorded as a
`STATUS.md` follow-up instead.

### 8. Module wiring

Register in `task-manager.module.ts` the six controllers **and** the five
providers `FetchPlansUseCase`, `CreatePlanUseCase`, `EditPlanUseCase`,
`DeletePlanUseCase`, and `ConfirmPlanUseCase`. `PlansRepository` is already
provided and exported by `DatabaseModule`.

### 9. Swagger

`@ApiTags('Plans')` plus operation and response decorators on the six
controllers, errors referencing `ApiErrorResponseDto`, responses referencing
`FetchPlansResponseDto` and `CreatePlanResponseDto`.

### 10. Tests

One E2E spec per controller, following the existing pattern: `AppModule` +
`PrismaService`, session cookie, `UUIDGenerator`, a single seed through
`prisma.user.create`, and assertions against Prisma after the request.

- `fetch-plans`: seed plans inside and outside the range and assert the returned
  count plus the `task`/`category` summaries.
- `create-plan`: assert the response body and the persisted Plan, including a
  future interval, which Plans explicitly allow.
- `edit-plan`: partial update, and clearing a relation with `null`.
- `edit-plan-schedule`: move the interval; assert `title` untouched; assert the
  `404` for another user's Plan.
- `delete-plan`: `204` and the Plan gone.
- `confirm-plan`: `204`, `confirmedAt` set, a Work Log created with the Plan's
  title and interval, and a second request answering `409`.

Use past dates (January 2026) wherever `record-as-done` is involved, since the
use case rejects a future `endsAt`. No fake timers are needed.

Unit suites must keep passing untouched — no domain file changes.

## Out of scope

- Any Task, Category, Work Log, Identity, domain, or persistence file.
- Making `record-as-done` atomic. `ConfirmPlanUseCase` currently creates the Work
  Log and saves the Plan in two separate awaits, so a failure between them
  leaves a Work Log without a confirmed Plan. This is a real risk, it belongs to
  the domain/persistence layer, and it stays a `STATUS.md` follow-up.
- Returning the created Work Log from `record-as-done`.
- Dashboard, Reports, and notification settings.

## Verification

```bash
npm run test:unit --prefix api
```

```bash
npm run test:e2e --prefix api
```

Unit must stay at its current count with no domain change; E2E gains six specs.
Also run `npx biome check src/infra/http/task-manager` and `npx tsc --noEmit`,
checking that no new error appears under `src/infra`.

`STATUS.md` is updated to the resulting state in the implementation commit.

Result: unit `143 passed (34 files)`, E2E `44 passed (37 files)`.
