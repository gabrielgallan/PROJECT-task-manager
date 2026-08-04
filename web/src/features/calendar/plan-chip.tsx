import { parseISO } from 'date-fns'
import { PLAN_DOT } from '@/features/calendar/colors'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { formatTime } from '@/features/calendar/helpers'
import type { IPlan } from '@/features/calendar/interfaces'
import { cn } from '@/lib/utils'

interface IProps {
	plan: IPlan
	className?: string
	showTime?: boolean
}

/** Single-line representation of a plan, for the month grid and the agenda. */
export function PlanChip({ plan, className, showTime = true }: IProps) {
	const { use24HourFormat, openEditPlan } = useCalendar()

	return (
		<button
			type="button"
			onClick={(event) => {
				event.stopPropagation()
				openEditPlan(plan)
			}}
			className={cn(
				'flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] transition-colors hover:bg-accent',
				className,
			)}
		>
			<span className={cn('size-1.5 shrink-0 rounded-full', PLAN_DOT[plan.color])} />
			{showTime && (
				<span className="shrink-0 text-muted-foreground tabular-nums">
					{formatTime(parseISO(plan.startDate), use24HourFormat)}
				</span>
			)}
			<span className="truncate font-medium">{plan.title}</span>
		</button>
	)
}
