import { CalendarBody } from '@/features/calendar/calendar-body'
import { CalendarHeader } from '@/features/calendar/calendar-header'
import { CalendarProvider } from '@/features/calendar/contexts/calendar-context'
import { DndProvider } from '@/features/calendar/contexts/dnd-context'
import type { IPlan } from '@/features/calendar/interfaces'
import { PlanDialog } from '@/features/calendar/plan-dialog'
import type { TCalendarView } from '@/features/calendar/types'
import { cn } from '@/lib/utils'

interface IProps {
	plans: IPlan[]
	defaultView?: TCalendarView
	className?: string
}

/**
 * Fills the height it is given, so the page is responsible for the outer box.
 */
export function Calendar({ plans, defaultView = 'week', className }: IProps) {
	return (
		<CalendarProvider plans={plans} defaultView={defaultView}>
			<DndProvider>
				<div
					className={cn(
						'flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl bg-background',
						className,
					)}
				>
					<CalendarHeader />
					<CalendarBody />
				</div>

				{/* Mounted once for the whole calendar. */}
				<PlanDialog />
			</DndProvider>
		</CalendarProvider>
	)
}
