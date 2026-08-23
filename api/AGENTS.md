# API Guide

This document applies to the `api/` project. Follow the product and domain boundaries in the repository-level `AGENTS.md` as well.

## Purpose and Current Boundary

The API uses a domain-centered architecture. Identity is implemented with HTTP and Prisma adapters. The Task Manager domain is in progress: some entities, repository ports, and use cases exist, but most endpoints and all Task Manager Prisma persistence are still pending.

`STATUS.md` is the canonical inventory of implemented and planned backend behavior. Update its layer checkboxes in the same change that adds or removes backend coverage.

## Technology

- NestJS 11 and TypeScript
- Prisma 7 with PostgreSQL
- Zod and nestjs-zod for runtime input validation
- Swagger decorators and Scalar for the HTTP reference
- Vitest for unit and end-to-end tests
- Redis through ioredis for cache adapters
- Cloudinary for object storage and Resend for email delivery
- Opaque session tokens stored as hashes and sent through an HTTP-only cookie

Use pnpm and the existing scripts:

- `pnpm run start:dev` starts Nest in watch mode.
- `pnpm run build` compiles the application.
- `pnpm run test:unit` runs domain/application tests.
- `pnpm run test:e2e` runs HTTP tests against an isolated PostgreSQL schema and requires a valid test database configuration.

## Architecture and Source Organization

### Core

`src/core` contains application-wide building blocks such as `Entity`, `UniqueEntityID`, `Either`, pagination types, and shared errors. Keep it independent from NestJS, Prisma, and individual domains unless an existing integration explicitly requires otherwise.

### Domain

`src/domain/<domain>` is split into:

- `enterprise/entities` for domain entities and state transitions;
- `application/use-cases` for orchestration and business rules;
- `application/repositories` and other application ports for abstract dependencies.

Domain and application code must depend on abstractions, not Prisma models, controllers, or provider SDKs.

### Infrastructure

`src/infra` contains framework and provider adapters:

- `http` owns Nest modules, controllers, DTOs, validation pipes, and presenters;
- `database/prisma` owns Prisma repositories and domain/Prisma mappers;
- `auth`, `cryptography`, `email`, `storage`, and `cache` implement application ports;
- `env` owns validated configuration.

Register concrete adapters in infrastructure modules and export repository abstractions to the modules that provide use cases.

## Programming Patterns

### Entities and use cases

- Create entities through their static factory and use `UniqueEntityID` at domain boundaries.
- Keep entity invariants and state transitions inside entities when they are intrinsic to that entity.
- A use case exposes one `execute` method and returns `Either<ExpectedError, SuccessValue>`.
- Return expected application errors through `left`; do not throw HTTP exceptions from the domain.
- Validate resource ownership in every user-scoped command or lookup. Do not reveal another user's resource through different not-found/forbidden behavior unless the contract explicitly requires it.
- Treat Tasks, Categories, Plans, and Work Logs as user-owned and independently useful resources.

### Repository ports and Prisma

- Define repository capabilities in the owning domain's application layer.
- Keep in-memory repositories under `test/unit/repositories` for use-case tests.
- Implement production repositories under `src/infra/database/prisma/repositories` and map through dedicated Prisma mappers.
- Do not pass generated Prisma records into the domain or return domain entities directly as public HTTP payloads.
- Database schema and migrations must preserve optional Task/Category relations and the deletion behavior documented in `STATUS.md`.

### HTTP

- Public routes live under `/api`; document them with Swagger decorators.
- Validate body, query, and path input with Zod-backed DTOs and `ZodValidationPipe`.
- Controllers translate `Either` errors into deliberate HTTP status codes and use presenters for output.
- Protected controllers obtain `userId` and `sessionId` through `CurrentUser`. Use `@Public()` only for endpoints that genuinely work without a session.
- Keep cookie configuration centralized and consistent across password and OAuth authentication.
- ISO 8601 is the public date-time format. Store instants in UTC and accept a timezone only when a query depends on calendar-day boundaries.

### Testing

- Co-locate unit specs with use cases and cover success, ownership, not-found, validation, and relevant conflict paths.
- Unit tests use in-memory repositories and provider stubs; they must not require external services.
- Co-locate controller E2E specs with controllers. E2E setup creates a unique PostgreSQL schema, deploys migrations, and drops that schema afterward.
- Add E2E coverage when a route is wired through HTTP and Prisma. A passing unit test does not make a route operational.

## API-Wide Domain Rules

- Every persisted application resource belongs to the authenticated user.
- IDs and timestamps are generated by the backend.
- Task, Category, Plan, and Work Log remain independent resources.
- `taskId` and `categoryId` are optional on Plans and Work Logs.
- Deleting a Task or Category retains related records and clears the corresponding references.
- Values within the same filter facet use OR; different facets combine with AND.
- Work Log ranges are half-open for overlap checks: adjacent ranges may touch but may not intersect.
- Operations that create or update multiple resources, such as recording a Plan as done, must be transactional.

## Style and Verification

- Prefer the `@/` alias for `src` imports and `test/*` for test helpers.
- Follow the repository Biome configuration: tabs, single quotes, no required semicolons, organized imports, and a 100-character line width.
- Preserve the current file naming style: kebab-case files and descriptive use-case/controller names.
- Run `pnpm run build` and `pnpm run test:unit` after application or domain changes. Run relevant E2E tests when HTTP, Prisma, authentication, migrations, or external adapters change.
