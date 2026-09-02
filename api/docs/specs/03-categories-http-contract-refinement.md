# 03 — Categories HTTP contract refinement

Status: implemented
Scope: `src/infra/http/task-manager` (Category routes only) and `api/STATUS.md`
Created: 2026-09-01

## Context

Categories were the last Task Manager domain whose HTTP layer lagged behind the
standard set by `docs/specs/01-tasks-http-contract-refinement.md` and
`docs/specs/02-work-logs-http-contract-refinement.md`. The `STATUS.md` review
listed eight items; all are settled and implemented here. No use case,
repository, mapper, Prisma schema, or migration changes. No Task, Work Log,
Plan, or Identity file is touched.

## Decisions

1. `NotAllowedError` maps to `404` on every Category route, so a Category owned
   by another user is indistinguishable from a missing one.
2. Editing a Category becomes `PATCH /api/categories/:categoryId`, matching its
   partial payload semantics.
3. `GET /api/categories/:categoryId/deletion-impact` returns its counts under
   `data`, like every other Task Manager route.
4. `POST /api/categories` returns the created Category in the body, presented by
   `CategoryPresenter`.
5. The Zod DTOs restate the rules the use cases enforce: the color enum and the
   1–40 character name limit.
6. All Category controllers gain Swagger documentation.
7. `DELETE /api/categories/:categoryId` gains E2E coverage proving the relation
   cleanup.
8. Two standardization deviations are fixed: the space-indented
   `fetch-categories.controller.ts` and the misspelled `create-cateogory.dto.ts`.

## Deliverables

### 1. DTOs aligned with the domain

- Rename `dto/create-cateogory.dto.ts` to `dto/create-category.dto.ts` and fix
  the single import in `create-category.controller.ts`.
- `categoryColorSchema = z.enum(CATEGORY_COLORS)`, reusing the constant already
  exported by `enterprise/entities/category.ts` instead of restating the 18
  colors. Required on create, optional on edit.
- `name` becomes `z.string().trim().min(1).max(40)` on both, mirroring the limit
  the use cases enforce.
- `dto/get-category-deletion-impact.dto.ts`: a param DTO of its own, so the
  route stops reusing `deleteCategoryParamSchema`.

### 2. `POST /api/categories` returns the created Category

`CreateCategoryUseCase` already returns `{ category }` and `CategoryPresenter.toHTTP`
already renders the `Category` entity, so no presenter change is needed here —
unlike Work Logs, whose created payload required a dedicated method.

- `CreateCategoryResponseDto` exposing `data: CategoryDto`, mirroring
  `CreateTaskResponseDto`.
- The controller returns `{ data: CategoryPresenter.toHTTP(category) }` with the
  existing `201`.

### 3. `PUT` becomes `PATCH` on `/api/categories/:categoryId`

`edit-category.controller.ts`: swap `@Put()` for `@Patch()`. Route, DTOs, and
the `204` response are unchanged.

### 4. Uniform `404` for ownership

`edit-category`, `delete-category`, and `get-category-deletion-impact` map both
`ResourceNotFoundError` and `NotAllowedError` to
`NotFoundException('Category not found')`. `UnauthorizedException` is removed
from those imports.

### 5. Deletion impact under `data`

`CategoryDeletionImpactDto` (`plansCount`, `workLogsCount`) and
`GetCategoryDeletionImpactResponseDto` wrapping it under `data`. The controller
returns `{ data: result.value }`, and the existing E2E moves from
`response.body` to `response.body.data`.

### 6. Swagger on the Category routes

`@ApiTags('Categories')` plus operation and response decorators on the five
controllers. Errors reference `ApiErrorResponseDto`; fetch references a new
`FetchCategoriesResponseDto` built on the already decorated `CategoryDto`, and
create references `CreateCategoryResponseDto`.

### 7. Standardization

Rewrite `fetch-categories.controller.ts` with tabs — it was the only Task
Manager file indented with spaces — and drop the dangling comma in its
`@nestjs/common` import. Biome does not flag either, so the fix is manual.

### 8. Tests

- `create-category.controller.e2e-spec.ts`: assert the returned body alongside
  the persistence assertions.
- `edit-category.controller.e2e-spec.ts`: switch to `.patch(...)` and rename the
  test to `[PATCH] /api/categories/:categoryId`.
- `get-category-deletion-impact.controller.e2e-spec.ts`: read `response.body.data`.
- `delete-category.controller.e2e-spec.ts`: add a case seeding a Plan and a Work
  Log related to the Category and asserting both survive with a cleared
  `categoryId` after the delete.
- Unit suites must keep passing untouched — no domain file changes.

## Out of scope

- Any Task, Work Log, Plan, Identity, domain, or persistence file.
- `uncategorizedColor`, which stays a frontend-only preference.

## Verification

```bash
npm run test:unit --prefix api
```

```bash
npm run test:e2e --prefix api
```

Both suites must pass. `STATUS.md` is updated to the resulting state in the same
commit.

Result: unit `143 passed (34 files)`, E2E `34 passed (31 files)` — the relation
cleanup is asserted inside the existing delete test rather than as a new one, so
the test count is unchanged.
