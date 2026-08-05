import type { ICalendarItem, ICalendarRange } from '@/features/calendar/types'
import type { TPlanColor } from '@/features/plans/model/plan-colors'

export interface IPlan extends ICalendarItem {
	title: string
	description?: string
	color: TPlanColor
	taskId?: string | null
}

export type TPlanDialogState =
	| { mode: 'closed' }
	| { mode: 'create'; range: ICalendarRange }
	| { mode: 'edit'; plan: IPlan }
