import type { TPlanColor } from '@/features/calendar/types'

export const PLAN_COLORS: TPlanColor[] = ['blue', 'green', 'red', 'yellow', 'purple', 'orange']

/** Height of one hour row, in pixels. Drives every time-grid calculation. */
export const HOUR_HEIGHT = 48

/** Granularity of a clickable / droppable slot, in minutes. */
export const SLOT_MINUTES = 30

export const SLOTS_PER_HOUR = 60 / SLOT_MINUTES

/** Monday. Matches how a work week is planned. */
export const WEEK_STARTS_ON = 1 as const

/** Hours outside this range are dimmed and the grid does not scroll to them. */
export const WORK_DAY_START_HOUR = 8
export const WORK_DAY_END_HOUR = 18

/** Default duration applied when creating a plan from an empty slot, in minutes. */
export const DEFAULT_PLAN_DURATION = 30

export const MINUTES_PER_DAY = 24 * 60
