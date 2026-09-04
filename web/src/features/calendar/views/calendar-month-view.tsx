import { addDays, format, startOfWeek } from 'date-fns'
import { useMemo } from 'react'
import { useCalendar } from '@/features/calendar/calendar-provider'
import { MonthCell } from '@/features/calendar/components/month-cell'
import { WEEK_STARTS_ON } from '@/features/calendar/constants'
import { getCalendarCells } from '@/features/calendar/lib/date'
import type { ICalendarItem, ICalendarProps } from '@/features/calendar/types'

type TMonthViewProps<TItem extends ICalendarItem> = Pick<
	ICalendarProps<TItem>,
	'items' | 'onCreate' | 'onOpen' | 'onMove' | 'renderItem' | 'getItemClassName' | 'isItemDisabled'
>

export function CalendarMonthView<TItem extends ICalendarItem>(props: TMonthViewProps<TItem>) {
	const { selectedDate } = useCalendar()
	const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate])
	const weekdayLabels = useMemo(() => {
		const start = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON })
		return Array.from({ length: 7 }, (_, index) => format(addDays(start, index), 'EEE'))
	}, [])

	return (
		<div className="calendar-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
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
					<MonthCell key={cell.date.toISOString()} cell={cell} {...props} />
				))}
			</div>
		</div>
	)
}
