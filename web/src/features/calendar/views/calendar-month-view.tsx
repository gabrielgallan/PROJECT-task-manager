import { addDays, format, startOfWeek } from 'date-fns'
import { useMemo } from 'react'
import { WEEK_STARTS_ON } from '@/features/calendar/constants'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { DayCell } from '@/features/calendar/day-cell'
import { getCalendarCells } from '@/features/calendar/helpers'
import type { IPlan } from '@/features/calendar/interfaces'

export function CalendarMonthView({ plans }: { plans: IPlan[] }) {
	const { selectedDate } = useCalendar()

	const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate])

	const weekdayLabels = useMemo(() => {
		const start = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON })
		return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'EEE'))
	}, [])

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
			<div className="sticky top-0 z-20 grid grid-cols-7 border-b bg-background">
				{weekdayLabels.map((label) => (
					<div
						key={label}
						className="py-2 text-center text-[11px] font-medium uppercase text-muted-foreground"
					>
						{label}
					</div>
				))}
			</div>

			<div className="grid flex-1 auto-rows-fr grid-cols-7 border-l">
				{cells.map((cell) => (
					<DayCell key={cell.date.toISOString()} cell={cell} plans={plans} />
				))}
			</div>
		</div>
	)
}
