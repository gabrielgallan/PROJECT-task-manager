import type { Range } from '@/components/kibo-ui/gantt'

/** Tasks usually span days, so the timeline opens closer than the gantt default. */
export const DEFAULT_GANTT_RANGE: Range = 'daily'

export const DEFAULT_GANTT_ZOOM = 100
export const MIN_GANTT_ZOOM = 50
export const MAX_GANTT_ZOOM = 200
