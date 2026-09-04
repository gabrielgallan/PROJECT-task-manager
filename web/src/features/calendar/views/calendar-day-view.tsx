import { format, isSameDay } from 'date-fns'
import { useCalendar } from '@/features/calendar/calendar-provider'
import { AllDayRow } from '@/features/calendar/components/all-day-row'
import {
	DayColumn,
	GUTTER_CLASS,
	TimeGridScroller,
	TimeGutter,
} from '@/features/calendar/components/time-grid'
import { splitItemsBySpan } from '@/features/calendar/lib/layout'
import type { ICalendarItem, ICalendarProps } from '@/features/calendar/types'
import { cn } from '@/lib/utils'

type TDayViewProps<TItem extends ICalendarItem> = Pick<
	ICalendarProps<TItem>,
	| 'items'
	| 'onCreate'
	| 'onOpen'
	| 'onMove'
	| 'onResize'
	| 'renderItem'
	| 'getItemClassName'
	| 'isItemDisabled'
>

export function CalendarDayView<TItem extends ICalendarItem>(props: TDayViewProps<TItem>) {
	const { selectedDate, getNow } = useCalendar()
	const { timed, multiDay } = splitItemsBySpan(props.items)

	return (
		<TimeGridScroller>
			<div className="sticky top-0 z-30 border-b bg-background">
				<div className="flex">
					<div className={GUTTER_CLASS} />
					<div className="flex flex-1 items-center gap-2 border-l py-2 pl-3">
						<span className="text-[11px] font-medium uppercase text-muted-foreground">
							{format(selectedDate, 'EEEE')}
						</span>
						<span
							className={cn(
								'flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
								isSameDay(selectedDate, getNow()) && 'bg-primary text-primary-foreground',
							)}
						>
							{format(selectedDate, 'd')}
						</span>
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
								days={[selectedDate]}
								items={multiDay}
								onOpen={props.onOpen}
								renderItem={props.renderItem}
								getItemClassName={props.getItemClassName}
								isItemDisabled={props.isItemDisabled}
							/>
						</div>
					</div>
				)}
			</div>

			<div className="flex">
				<TimeGutter />
				<div className="flex flex-1 border-l">
					<DayColumn {...props} items={timed} day={selectedDate} showCurrentTimeLabel />
				</div>
			</div>
		</TimeGridScroller>
	)
}
