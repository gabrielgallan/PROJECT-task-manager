import type { ICalendarItem, ICalendarRange } from '@/features/calendar/types'

export interface IPlan extends ICalendarItem {
	title: string
	description?: string
	taskId?: string | null
	categoryId?: string | null
	/**
	 * When this plan was recorded as done. It is a local mark, not a reference:
	 * plans never point at work logs, so the two modules stay independent.
	 */
	confirmedAt?: string | null
}

export type TPlanDialogState =
	| { mode: 'closed' }
	| { mode: 'create'; range: ICalendarRange }
	| { mode: 'edit'; plan: IPlan }
