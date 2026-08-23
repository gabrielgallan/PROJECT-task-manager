# Frontend Guide

This document applies to the `web/` project. Follow the product and domain boundaries in the repository-level `AGENTS.md` as well.

## Purpose and Current Boundary

The frontend is a product prototype used to validate complete interaction flows before API integration. Tasks, Plans, Work Logs, Categories, Dashboard, Reports, Settings, and Identity currently use mocks, local component state, Jotai atoms, or `localStorage` as appropriate.

Treat the current stores as prototype coordination state, not as the final data-access layer. Do not add speculative API abstractions or backend-driven rules until integration work is explicitly in scope.

## Technology

- React 19 and TypeScript with strict compiler checks
- Vite for development and production builds
- Tailwind CSS 4 for styling
- shadcn/ui and local UI primitives under `src/components/ui`
- React Router for routes and URL state
- Jotai for small shared in-memory stores
- React Hook Form with Zod schemas for forms
- date-fns for date calculations and formatting
- dnd-kit, resizable primitives, Recharts, and Motion for rich interactions and visualization
- Biome configuration inherited from the repository root

Use pnpm and the existing scripts:

- `pnpm run dev` starts Vite.
- `pnpm run build` creates the production bundle.
- `pnpm run typecheck` runs TypeScript without emitting files.

## Source Organization

- `src/app/layouts` contains route-level shells.
- `src/app/pages` contains pages and page-specific components. Keep orchestration close to its page when it is not reusable domain behavior.
- `src/features/<feature>` owns feature models, rules, constants, mocks, stores, hooks, and reusable feature components.
- `src/features/calendar` is shared calendar infrastructure used by Plans and Work Logs; it must not contain behavior specific to only one of those resources.
- `src/components/ui` contains UI primitives. Preserve their generic API and avoid adding product rules to them.
- `src/components` contains reusable application components that are not owned by one feature.
- `src/hooks`, `src/lib`, and `src/styles` contain genuinely cross-feature utilities and styling.

Prefer the `@/` alias for imports from `src`. Use relative imports only for files that are tightly local to the same module.

## Programming Patterns

### Models and rules

- Keep domain-facing types in `features/<feature>/model` rather than declaring competing shapes inside pages.
- Keep labels, ranks, allowed values, and validation rules centralized. Status and priority ordering are domain orderings, not alphabetical orderings.
- Keep derived calculations as pure functions where practical. Calendar layout, Task queries, report aggregation, and Work Log interval validation already follow this approach.
- Use `null` or an absent value consistently with the existing model. `taskId` and `categoryId` are optional relations; never use UI sentinel values as stored IDs.

### State

- Jotai feature stores coordinate mock data across routes and views. Mutations must remain visible to every consumer of the same resource.
- Component state is preferred for dialogs, drafts, temporary selections, and other page-local interaction state.
- Use URL search parameters for shareable query state such as view, filters, sorting, and pagination. Hand-edited URLs must degrade safely to defaults.
- Use `localStorage` only for explicitly local preferences such as theme, language, timezone, or other settings that are currently outside the API scope.

### Forms and validation

- Use React Hook Form with a Zod schema and `zodResolver` for non-trivial forms.
- Put reusable schemas and form types in the owning feature model; page-only settings forms may keep their model beside the page.
- Enforce the product rule at the point of interaction and keep the rule available as a reusable function when drag, resize, dialog, and shortcut flows share it.
- Show actionable errors. For example, an overlapping Work Log should identify the conflicting record.

### Components and pages

- Pages orchestrate feature state, navigation, dialogs, toasts, and view composition.
- Feature components receive data and callbacks through props when that keeps them reusable and testable.
- Keep UI primitives product-agnostic. Compose them in feature or page components rather than embedding application behavior into generated shadcn/ui files.
- Reuse the existing calendar, filter, combobox, date/time, empty-state, and dialog patterns before creating parallel implementations.

## Domain Constraints to Preserve

- Tasks, Plans, and Work Logs remain independently usable.
- Plans and Work Logs may reference a Task and a Category, but neither reference is required.
- A Plan represents intent and may be in the future or cross midnight.
- A Work Log represents completed work: its end must be after its start, it must stay within one day, it cannot end in the future, and it cannot overlap another Work Log. Touching half-open intervals are allowed.
- Recording a Plan as done creates a Work Log and confirms the Plan; the user-visible operation must behave atomically once backed by the API.
- Deleting a Category clears its references from Plans and Work Logs instead of deleting those records.
- Calendar colors are resolved from Categories; uncategorized items use the user preference fallback.

## Style and Verification

- Follow strict TypeScript and do not silence type failures with broad casts.
- Follow the root Biome rules: tabs, single quotes in JavaScript/TypeScript, double quotes in JSX, no required semicolons, organized imports, and a 100-character line width.
- Preserve accessibility behavior provided by the UI primitives and supply labels for icon-only controls.
- Keep responsive desktop and mobile navigation usable when changing route-level UI.
- At minimum, run `pnpm run typecheck` after frontend changes. Run `pnpm run build` for routing, dependency, or production-bundle changes.
