import type { ICalendarItem, ICalendarRange } from '@/features/calendar/types'
import type {
	IsoDateTime,
	WorkLogCategorySummaryDto,
	WorkLogTaskSummaryDto,
} from './work-log-api-types'

/**
 * A record of work that was actually done. Always a closed interval inside a
 * single day, and never in the future — that is what keeps it distinct from a
 * Plan, which states an intention.
 */
export interface WorkLog {
	id: string
	title: string
	description: string | null
	task: WorkLogTaskSummaryDto | null
	category: WorkLogCategorySummaryDto | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	createdAt: IsoDateTime
	updatedAt: IsoDateTime | null
}

export interface CreatedWorkLog {
	id: string
	taskId: string | null
	categoryId: string | null
	title: string
	description: string | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	createdAt: IsoDateTime
	updatedAt: IsoDateTime | null
}

export interface WorkLogCalendarItem extends ICalendarItem {
	workLog: WorkLog
}

export type TWorkLogDialogState =
	| { mode: 'closed' }
	| {
			mode: 'create'
			range: ICalendarRange
			original?: { startsAt: IsoDateTime; endsAt: IsoDateTime }
	  }
	| { mode: 'edit'; item: WorkLogCalendarItem }
