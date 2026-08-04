import { format, isToday } from 'date-fns'
import { AllDayRow } from '@/features/calendar/all-day-row'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { splitPlansBySpan } from '@/features/calendar/helpers'
import type { IPlan } from '@/features/calendar/interfaces'
import { DayColumn, GUTTER_CLASS, TimeGridScroller, TimeGutter } from '@/features/calendar/time-grid'
import { cn } from '@/lib/utils'

export function CalendarDayView({ plans }: { plans: IPlan[] }) {
	const { selectedDate } = useCalendar()

	const { timed, multiDay } = splitPlansBySpan(plans)

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
								isToday(selectedDate) && 'bg-primary text-primary-foreground',
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
							<AllDayRow days={[selectedDate]} plans={multiDay} />
						</div>
					</div>
				)}
			</div>

			<div className="flex">
				<TimeGutter />
				<div className="flex flex-1 border-l">
					<DayColumn day={selectedDate} plans={timed} showCurrentTimeLabel />
				</div>
			</div>
		</TimeGridScroller>
	)
}
