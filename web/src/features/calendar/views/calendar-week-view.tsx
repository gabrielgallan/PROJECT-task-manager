import { format, isToday } from 'date-fns'
import { useCalendar } from '@/features/calendar/calendar-provider'
import { AllDayRow } from '@/features/calendar/components/all-day-row'
import {
	DayColumn,
	GUTTER_CLASS,
	TimeGridScroller,
	TimeGutter,
} from '@/features/calendar/components/time-grid'
import { getWeekDays } from '@/features/calendar/lib/date'
import { splitItemsBySpan } from '@/features/calendar/lib/layout'
import type { ICalendarItem, ICalendarProps } from '@/features/calendar/types'
import { cn } from '@/lib/utils'

type TWeekViewProps<TItem extends ICalendarItem> = Pick<
	ICalendarProps<TItem>,
	'items' | 'onCreate' | 'onOpen' | 'onMove' | 'onResize' | 'renderItem' | 'getItemClassName'
>

export function CalendarWeekView<TItem extends ICalendarItem>(props: TWeekViewProps<TItem>) {
	const { selectedDate, showWeekends, setView, setSelectedDate } = useCalendar()
	const days = getWeekDays(selectedDate, showWeekends)
	const { timed, multiDay } = splitItemsBySpan(props.items)

	return (
		<TimeGridScroller>
			<div className="sticky top-0 z-30 border-b bg-background">
				<div className="flex">
					<div className={GUTTER_CLASS} />
					<div className="flex flex-1">
						{days.map((day) => (
							<button
								key={day.toISOString()}
								type="button"
								onClick={() => {
									setSelectedDate(day)
									setView('day')
								}}
								className="flex flex-1 flex-col items-center gap-0.5 border-l py-2 transition-colors hover:bg-accent"
							>
								<span className="text-[11px] font-medium uppercase text-muted-foreground">
									{format(day, 'EEE')}
								</span>
								<span
									className={cn(
										'flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
										isToday(day) && 'bg-primary text-primary-foreground',
									)}
								>
									{format(day, 'd')}
								</span>
							</button>
						))}
					</div>
				</div>

				{multiDay.length > 0 && (
					<div className="flex border-t">
						<div
							className={cn(
								GUTTER_CLASS,
								'flex items-center justify-end pr-2 text-[10px] uppercase text-muted-foreground',
							)}
						>
							All day
						</div>
						<div className="flex-1 border-l px-px">
							<AllDayRow
								days={days}
								items={multiDay}
								onOpen={props.onOpen}
								renderItem={props.renderItem}
								getItemClassName={props.getItemClassName}
							/>
						</div>
					</div>
				)}
			</div>

			<div className="flex">
				<TimeGutter />
				<div className="flex flex-1">
					{days.map((day, index) => (
						<div
							key={day.toISOString()}
							className={cn('flex flex-1 border-l', isToday(day) && 'bg-primary/[0.03]')}
						>
							<DayColumn
								{...props}
								items={timed}
								day={day}
								showCurrentTimeLabel={index === 0}
							/>
						</div>
					))}
				</div>
			</div>
		</TimeGridScroller>
	)
}
