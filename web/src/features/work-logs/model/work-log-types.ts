import type { ICalendarItem, ICalendarRange } from '@/features/calendar/types'

/**
 * A record of work that was actually done. Always a closed interval inside a
 * single day, and never in the future — that is what keeps it distinct from a
 * Plan, which states an intention.
 */
export interface IWorkLog extends ICalendarItem {
	title: string
	description?: string
	taskId?: string | null
	categoryId?: string | null
	createdAt: string
	updatedAt: string
}

export type TWorkLogDialogState =
	| { mode: 'closed' }
	| { mode: 'create'; range: ICalendarRange }
	| { mode: 'edit'; workLog: IWorkLog }
