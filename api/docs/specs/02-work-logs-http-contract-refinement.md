# 02 — Work Logs HTTP contract refinement

Status: implemented
Scope: `src/infra/http/task-manager` (Work Log routes only) and `api/STATUS.md`
Created: 2026-09-01

## Context

Work Logs already have complete domain, persistence, and test coverage, but
their HTTP layer lagged behind the standard `docs/specs/01-tasks-http-contract-refinement.md`
established for Tasks. The `STATUS.md` review surfaced seven items; all are
settled and implemented here. No use case, repository, mapper, Prisma schema, or
migration changes. No Task, Category, Plan, or Identity file is touched.

## Decisions

1. `NotAllowedError` maps to `404` on every Work Log route, so a Work Log owned
   by another user is indistinguishable from a missing one.
2. Editing a Work Log becomes `PATCH /api/work-logs/:workLogId`, matching its
   partial payload semantics.
3. `PATCH /api/work-logs/:workLogId/schedule` is added, reusing
   `EditWorkLogUseCase`.
4. The overlap error stays a plain `400` with its message. The requirement that
   it identify the conflicting Work Log is dropped from `STATUS.md` rather than
   implemented, since it would mean changing the domain.
5. `POST /api/work-logs` returns the created Work Log in the body, presented by
   `WorkLogPresenter`.
6. `timeZone` stays required on the edit body: the use case revalidates the
   calendar day of the resulting interval on every edit.
7. All Work Log controllers gain Swagger documentation, following the Identity
   and Task controllers pattern.

## Deliverables

### 1. `POST /api/work-logs` returns the created Work Log

`CreateWorkLogUseCase` returns the `WorkLog` entity, which carries `taskId` and
`categoryId` but not the `task`/`category` summaries that `WorkLogPresenter.toHTTP`
renders from the `WorkLogData` value object built by the fetch path. Rather than
reporting `null` relations that may not be null, the created payload exposes the
raw ids:

- `dtos/created-work-log.dto.ts`: `CreatedWorkLogDto` with `id`, `taskId`,
  `categoryId`, `title`, `description`, `startsAt`, `endsAt`, `createdAt`, and
  `updatedAt`, decorated with `@ApiProperty`.
- `presenters/work-log-presenter.ts`: add `WorkLogPresenter.toHTTPCreated`,
  leaving the existing `toHTTP` untouched.
- `dto/create-work-log.dto.ts`: `CreateWorkLogResponseDto` exposing
  `data: CreatedWorkLogDto`, mirroring `CreateTaskResponseDto`.
- `create-work-log.controller.ts`: return
  `{ data: WorkLogPresenter.toHTTPCreated(workLog) }` with the existing `201`.

### 2. `PUT` becomes `PATCH` on `/api/work-logs/:workLogId`

`edit-work-log.controller.ts`: swap `@Put()` for `@Patch()`. Route, DTOs, and the
`204` response are unchanged, `timeZone` included.

### 3. Focused schedule route

- `dto/edit-work-log-schedule.dto.ts`: `editWorkLogScheduleParamSchema`
  (`workLogId` UUID) and `editWorkLogScheduleSchema` with optional `startsAt`
  and `endsAt` (ISO datetimes transformed into `Date`, as in
  `edit-work-log.dto.ts`) and a required `timeZone`.
- `edit-work-log-schedule.controller.ts`: `EditWorkLogScheduleController` on
  `/api/work-logs/:workLogId/schedule`, `@Patch()`, `204`, delegating to
  `EditWorkLogUseCase` with only the interval and the timezone.

Unlike Tasks, there is no "clear the date" state here: `startsAt` and `endsAt`
are required on the entity, so the fields are optional but never nullable and
`parseEditableDate` is not reused.

### 4. Uniform `404` for ownership

`create-work-log`, `edit-work-log`, `edit-work-log-schedule`, and
`delete-work-log` map both `ResourceNotFoundError` and `NotAllowedError` to a
`404`. The edit, schedule, and delete routes answer `Work log not found`; the
create route answers `Work log relation not found`, because there its
`ResourceNotFoundError` reports a missing or foreign referenced Task or
Category, not a missing Work Log. `UnauthorizedException` is removed from those
imports.

### 5. Swagger on the Work Log routes

Add `@ApiTags('Work Logs')` plus operation and response decorators to the five
controllers. Errors reference `ApiErrorResponseDto`; the create route references
`CreateWorkLogResponseDto` and the fetch route a new `FetchWorkLogsResponseDto`
built on the already decorated `WorkLogDto`.

`fetch-work-logs.controller.ts` also stops discarding the use-case message: an
inverted range now returns `400 to must be after from` instead of an empty
`BadRequestException`.

### 6. Module wiring

Register `EditWorkLogScheduleController` in `task-manager.module.ts`.
`EditWorkLogUseCase` is already provided, so the providers list does not change.

### 7. Tests

- `create-work-log.controller.e2e-spec.ts`: assert the returned body alongside
  the persistence assertions.
- `edit-work-log.controller.e2e-spec.ts`: switch to `.patch(...)` and rename the
  test to `[PATCH] /api/work-logs/:workLogId`.
- `edit-work-log-schedule.controller.e2e-spec.ts` (new): move an interval and
  assert the persisted dates, plus a `404` for another user's Work Log.
- Unit suites must keep passing untouched — no domain file changes.

## Out of scope

- Any Task, Category, Plan, Identity, domain, or persistence file.
- Identifying the conflicting Work Log in the overlap error (decision 4).
- Making `timeZone` optional on the edit body (decision 6).

## Verification

```bash
npm run test:unit --prefix api
```

```bash
npm run test:e2e --prefix api
```

Both suites must pass. `STATUS.md` is updated to the resulting state in the same
commit.

Result: unit `143 passed (34 files)`, E2E `34 passed (31 files)`.
