import type { TCalendarView } from '@/features/calendar/types'

/** The day is the working unit: what was done today, hour by hour. */
export const WORK_LOG_VIEWS = ['day', 'week', 'agenda'] as const satisfies readonly TCalendarView[]

export const DEFAULT_WORK_LOG_VIEW: TCalendarView = 'day'

/** Own key so the view and format settings do not leak into the plans calendar. */
export const WORK_LOG_STORAGE_KEY = 'work-logs-calendar-settings'

export const DEFAULT_WORK_LOG_DURATION = 30

/** Below this, the gap since the last log is treated as no gap at all. */
export const MIN_WORK_LOG_DURATION = 5
