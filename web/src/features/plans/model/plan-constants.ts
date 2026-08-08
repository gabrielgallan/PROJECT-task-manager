import type { TCalendarView } from '@/features/calendar/types'

/** Planning reads forward, so the month is offered alongside the working views. */
export const PLAN_VIEWS = ['day', 'week', 'month'] as const satisfies readonly TCalendarView[]

export const DEFAULT_PLAN_VIEW: TCalendarView = 'week'

/** Own key so the view and format settings do not leak into the work logs calendar. */
export const PLAN_STORAGE_KEY = 'plans-calendar-settings'

export const DEFAULT_PLAN_DURATION = 30
