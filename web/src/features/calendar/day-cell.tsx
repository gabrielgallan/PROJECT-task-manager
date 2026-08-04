import { isToday, set } from 'date-fns'
import { useState } from 'react'
import { WORK_DAY_START_HOUR } from '@/features/calendar/constants'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { useDragDrop } from '@/features/calendar/contexts/dnd-context'
import { getPlansForCell } from '@/features/calendar/helpers'
import type { ICalendarCell, IPlan } from '@/features/calendar/interfaces'
import { PlanChip } from '@/features/calendar/plan-chip'
import { cn } from '@/lib/utils'

const MAX_VISIBLE = 3

interface IProps {
	cell: ICalendarCell
	plans: IPlan[]
}

export function DayCell({ cell, plans }: IProps) {
	const { date, day, currentMonth } = cell
	const { openCreatePlan, setSelectedDate, setView } = useCalendar()
	const { dropOn } = useDragDrop()
	const [isOver, setIsOver] = useState(false)

	const cellPlans = getPlansForCell(date, plans)
	const visible = cellPlans.slice(0, MAX_VISIBLE)
	const hiddenCount = cellPlans.length - visible.length

	const openDay = () => {
		setSelectedDate(date)
		setView('day')
	}

	return (
		<div
			className={cn(
				'group flex min-h-28 flex-col gap-0.5 border-r border-b p-1 transition-colors',
				!currentMonth && 'bg-muted/30',
				isOver && 'bg-primary/10',
			)}
			onDragOver={(event) => {
				event.preventDefault()
				if (!isOver) setIsOver(true)
			}}
			onDragLeave={() => setIsOver(false)}
			onDrop={(event) => {
				event.preventDefault()
				setIsOver(false)
				dropOn(date)
			}}
		>
			<div className="flex items-center justify-between">
				<span
					className={cn(
						'flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums',
						!currentMonth && 'text-muted-foreground/60',
						isToday(date) && 'bg-primary font-semibold text-primary-foreground',
					)}
				>
					{day}
				</span>

				<button
					type="button"
					aria-label="Add a plan"
					onClick={() =>
						openCreatePlan(
							set(date, { hours: WORK_DAY_START_HOUR, minutes: 0, seconds: 0, milliseconds: 0 }),
						)
					}
					className="rounded px-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
				>
					+
				</button>
			</div>

			<div className="flex flex-col gap-px">
				{visible.map((plan) => (
					<PlanChip key={plan.id} plan={plan} />
				))}

				{hiddenCount > 0 && (
					<button
						type="button"
						onClick={openDay}
						className="px-1 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline"
					>
						+{hiddenCount} more
					</button>
				)}
			</div>
		</div>
	)
}
