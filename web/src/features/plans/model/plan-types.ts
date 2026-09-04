import type { ICalendarItem, ICalendarRange } from '@/features/calendar/types'
import type { IsoDateTime, PlanCategorySummaryDto, PlanTaskSummaryDto } from './plan-api-types'

export interface Plan {
	id: string
	title: string
	description: string | null
	task: PlanTaskSummaryDto | null
	category: PlanCategorySummaryDto | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	confirmedAt: IsoDateTime | null
}

export interface PlanCalendarItem extends ICalendarItem {
	plan: Plan
}
export type IPlan = PlanCalendarItem

export type TPlanDialogState =
	| { mode: 'closed' }
	| { mode: 'create'; range: ICalendarRange }
	| { mode: 'edit'; plan: PlanCalendarItem }
