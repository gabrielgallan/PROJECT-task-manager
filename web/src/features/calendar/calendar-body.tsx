import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { CalendarAgendaView } from '@/features/calendar/views/calendar-agenda-view'
import { CalendarDayView } from '@/features/calendar/views/calendar-day-view'
import { CalendarMonthView } from '@/features/calendar/views/calendar-month-view'
import { CalendarWeekView } from '@/features/calendar/views/calendar-week-view'

export function CalendarBody() {
	const { view, plans } = useCalendar()

	switch (view) {
		case 'day':
			return <CalendarDayView plans={plans} />
		case 'week':
			return <CalendarWeekView plans={plans} />
		case 'month':
			return <CalendarMonthView plans={plans} />
		case 'agenda':
			return <CalendarAgendaView plans={plans} />
	}
}
