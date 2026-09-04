import { useCalendar } from '@/features/calendar/calendar-provider'
import type { ICalendarItem, ICalendarProps } from '@/features/calendar/types'
import { CalendarAgendaView } from '@/features/calendar/views/calendar-agenda-view'
import { CalendarDayView } from '@/features/calendar/views/calendar-day-view'
import { CalendarMonthView } from '@/features/calendar/views/calendar-month-view'
import { CalendarWeekView } from '@/features/calendar/views/calendar-week-view'

type TCalendarBodyProps<TItem extends ICalendarItem> = Pick<
	ICalendarProps<TItem>,
	| 'items'
	| 'onCreate'
	| 'onOpen'
	| 'onMove'
	| 'onResize'
	| 'renderItem'
	| 'getItemClassName'
	| 'isItemDisabled'
	| 'getAgendaEmptyText'
>

export function CalendarBody<TItem extends ICalendarItem>({
	getAgendaEmptyText,
	...props
}: TCalendarBodyProps<TItem>) {
	const { view } = useCalendar()

	switch (view) {
		case 'day':
			return <CalendarDayView {...props} />
		case 'week':
			return <CalendarWeekView {...props} />
		case 'month':
			return <CalendarMonthView {...props} />
		case 'agenda':
			return <CalendarAgendaView {...props} getEmptyText={getAgendaEmptyText} />
	}
}
