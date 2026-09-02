# 01 — Tasks HTTP contract refinement

Status: implemented
Scope: `src/infra/http/task-manager` (Tasks routes only) and `api/STATUS.md`
Created: 2026-09-01

## Context

The Tasks domain is fully wired through HTTP, persistence, and E2E tests. The
review recorded in `STATUS.md` surfaced five open decisions; all of them are now
settled and are implemented by this spec. No domain use case, repository,
mapper, Prisma schema, or migration changes. No Category or Work Log file is
touched.

## Decisions

1. `GET /api/tasks` keeps the query contract that exists in the code
   (`search`, repeated facet values, `limit`, `page`, `sortBy`, `sortDir`).
   `STATUS.md` is corrected to describe the implementation; aligning the
   frontend becomes a frontend follow-up.
2. Editing a Task becomes `PATCH /api/tasks/:taskId`, matching its partial
   payload semantics.
3. Two focused routes are added, both reusing `EditTaskUseCase`:
   `PATCH /api/tasks/:taskId/status` and `PATCH /api/tasks/:taskId/schedule`.
4. `NotAllowedError` maps to `404` on every Task route, so a Task owned by
   another user is indistinguishable from a missing one.
5. `POST /api/tasks` returns the created Task in the body, presented by
   `TaskPresenter`.

All Task controllers also gain Swagger documentation, following the Identity
controllers pattern (`@ApiTags`, `@ApiOperation`, and typed response
decorators referencing `ApiErrorResponseDto`).

## Deliverables

### 1. `POST /api/tasks` returns the created Task

- `dto/create-task.dto.ts`: add `CreateTaskResponseDto` exposing `data: TaskDto`,
  mirroring `FetchTasksResponseDto`.
- `create-task.controller.ts`: return `{ data: TaskPresenter.toHTTP(task) }`
  with the existing `201`.

### 2. `PUT` becomes `PATCH` on `/api/tasks/:taskId`

- `edit-task.controller.ts`: swap `@Put()` for `@Patch()`; the route, DTOs, and
  `204` response are unchanged.
- Fix the null handling while the file is open: the DTO already declares
  `description`, `startDate`, and `dueDate` as `nullish`, but the controller
  collapses `null` into `undefined` (`startDate ? new Date(startDate) : undefined`),
  which silently ignores a request that clears a date. Forward `null` as `null`
  so `EditTaskUseCase`'s `!== undefined` checks behave as designed.
- `utils/parse-editable-date.ts`: add `parseEditableDate`, which encodes that
  three-state contract (`undefined` keeps, `null` clears, string replaces) and is
  shared with the schedule route.

### 3. Focused status route

- `dto/edit-task-status.dto.ts`: `editTaskStatusParamSchema` (`taskId` UUID) and
  `editTaskStatusSchema` (`status`, required, reusing `taskStatusSchema` from
  `fetch-tasks.dto.ts`).
- `edit-task-status.controller.ts`: `EditTaskStatusController` on
  `/api/tasks/:taskId/status`, `@Patch()`, `204`, delegating to
  `EditTaskUseCase` with only `status`.

### 4. Focused schedule route

- `dto/edit-task-schedule.dto.ts`: `editTaskScheduleParamSchema` (`taskId` UUID)
  and `editTaskScheduleSchema` with `startDate` and `dueDate` as
  `z.iso.date().nullish()`, so a date can be set or cleared.
- `edit-task-schedule.controller.ts`: `EditTaskScheduleController` on
  `/api/tasks/:taskId/schedule`, `@Patch()`, `204`, delegating to
  `EditTaskUseCase` with only the two dates and forwarding `null` unchanged.

### 5. Uniform `404` for ownership

`edit-task`, `edit-task-status`, `edit-task-schedule`, and `delete-task`
controllers map both `ResourceNotFoundError` and `NotAllowedError` to
`NotFoundException('Task not found')`, as `GetTaskDetailsController` already
does. `UnauthorizedException` is removed from those imports.

The same `401` mapping still exists in the Category and Work Log controllers.
That is deliberately left untouched here and recorded as a follow-up.

### 6. Swagger on the Task routes

Add `@ApiTags('Tasks')` plus operation and response decorators to the six
existing Task controllers and the two new ones. Errors reference
`ApiErrorResponseDto`. Typed response bodies reference `FetchTasksResponseDto`
and the new `CreateTaskResponseDto`; `GET /api/tasks/options` and
`GET /api/tasks/:taskId` document a description only, because `TaskOptionDto`
and `TaskDetailsDto` carry no `@ApiProperty` decorators yet — decorating them
is recorded as a follow-up in `STATUS.md` rather than done here.

### 7. Module wiring

Register `EditTaskStatusController` and `EditTaskScheduleController` in
`task-manager.module.ts`. `EditTaskUseCase` is already provided, so the
providers list does not change.

### 8. Tests

- `edit-task.controller.e2e-spec.ts`: switch the request to `.patch(...)` and
  rename the test to `[PATCH] /api/tasks/:taskId`.
- `create-task.controller.e2e-spec.ts`: assert the returned body carries the
  created Task (`id`, `title`, `status`, `priority`) alongside the existing
  persistence assertions.
- `edit-task-status.controller.e2e-spec.ts` (new): move a Task to `DONE` and
  assert that `priority` and `title` are untouched.
- `edit-task-schedule.controller.e2e-spec.ts` (new): set both dates, then assert
  the persisted values; also assert that `null` clears `dueDate`.
- Unit suites must keep passing untouched — no domain file changes.

## Out of scope

- Any Category, Work Log, Plan, Identity, domain, or persistence file.
- Aligning `GET /api/tasks` with the frontend query contract.
- The `401` ownership mapping in Category and Work Log controllers.
- E2E coverage for `DELETE /api/tasks/:taskId` relation cleanup.

## Verification

```bash
npm run test:unit --prefix api
```

```bash
npm run test:e2e --prefix api
```

Both suites must pass. `STATUS.md` is updated to the resulting state in the same
commit.

Result: unit `143 passed (34 files)`, E2E `32 passed (30 files)`.
