# Project Context

This repository contains a personal productivity application. The current goal is to validate the product flows and domain boundaries before completing the API integration and replacing the frontend prototype state with persisted data.

## Core Concepts

The application coordinates three related but independent resources:

- **Tasks** describe what needs to be accomplished. A Task is a single unit of work even when it spans several weeks; do not assume projects or subtasks without an explicit product decision.
- **Plans** describe when the user intends to work. They are calendar time blocks and may optionally reference a Task.
- **Work Logs** describe what was actually done during a time interval. They form the work history and may optionally reference a Task.

Keep the distinction explicit:

- A Task defines an outcome.
- A Plan reserves intended time.
- A Work Log records actual time.

Each module must remain useful on its own. Links between them are optional enhancements, not prerequisites for completing an isolated flow.

Categories are optional visual classifications for Plans and Work Logs. They are not part of Tasks.

## Product Areas

- **Operational:** Tasks, Plans, Work Logs, Categories, and their create, edit, delete, query, and visualization flows. This is the primary scope.
- **Administrative:** dashboards, reports, and exports. These exist in the frontend prototype but are not the current backend priority.
- **Identity:** registration, authentication, profile, credentials, and sessions.

## Current State

- `web/` is a functional React prototype backed by static mocks and in-memory state. It contains operational pages plus Dashboard, Reports, Settings, and Identity screens.
- `api/` is a NestJS application. Identity is implemented end to end. The Task Manager domain is partially implemented, with several unit-tested use cases but little HTTP wiring and no Task Manager persistence yet.
- `api/STATUS.md` is the canonical backend coverage and roadmap document.
- Technology-specific architecture and conventions are documented in `web/AGENTS.md` and `api/AGENTS.md`.

## Product Direction

- Favor clear operational workflows and fast scanning, especially in time-based views.
- Keep planned time visually and conceptually distinct from completed work.
- Continue validating flows with static data where the product rules are not mature.
- Do not let the current backend implementation prematurely redefine frontend concepts.
- Avoid introducing dashboards, complex reports, projects, subtasks, or rigid cross-module dependencies unless they explicitly enter scope.
- Treat these documents as living context and update them when the implementation or product decisions change.
