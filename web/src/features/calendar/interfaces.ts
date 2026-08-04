import type { TPlanColor } from '@/features/calendar/types'

/**
 * A block of the calendar representing what you intend to do at a given time.
 *
 * `taskId` is the optional link to a Task. It is intentionally loose while the
 * domain entities are still being modelled — the calendar never dereferences it,
 * it only carries it around.
 */
export interface IPlan {
	id: string
	title: string
	description?: string
	/** ISO 8601 datetime. */
	startDate: string
	/** ISO 8601 datetime. */
	endDate: string
	color: TPlanColor
	taskId?: string | null
}

export interface ICalendarCell {
	day: number
	currentMonth: boolean
	date: Date
}
