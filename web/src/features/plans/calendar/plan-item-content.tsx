import { CircleCheck } from 'lucide-react'
import { useOptionalCalendar } from '@/features/calendar/calendar-provider'
import { formatDuration, formatTime } from '@/features/calendar/lib/formatting'
import type { ICalendarItemRenderContext } from '@/features/calendar/types'
import { PLAN_DOT, PLAN_SURFACE } from '@/features/plans/model/plan-colors'
import type { IPlan } from '@/features/plans/model/plan-types'
import { cn } from '@/lib/utils'

interface IPlanItemContentProps {
	plan: IPlan
	context: ICalendarItemRenderContext
	taskTitle?: string
	/** Only needed outside the calendar, where there is no provider to read it from. */
	use24HourFormat?: boolean
}

export function getPlanItemClassName(plan: IPlan, context: ICalendarItemRenderContext): string {
	return context.variant === 'month' ? '' : PLAN_SURFACE[plan.color]
}

export function PlanItemContent({
	plan,
	context,
	taskTitle,
	use24HourFormat: use24HourFormatProp,
}: IPlanItemContentProps) {
	const calendar = useOptionalCalendar()
	const use24HourFormat = use24HourFormatProp ?? calendar?.use24HourFormat ?? true
	// A plan often carries the task's own name; repeating it adds nothing.
	const taskLabel = taskTitle && taskTitle !== plan.title ? taskTitle : undefined

	switch (context.variant) {
		case 'time':
			return (
				<>
					<span className="flex items-center gap-1 truncate font-medium leading-tight">
						{plan.confirmedAt && <CircleCheck className="size-3 shrink-0 opacity-70" />}
						<span className="truncate">{plan.title}</span>
					</span>
					<span
						className={cn('truncate leading-tight opacity-70', context.isCompact && 'shrink-0')}
					>
						{formatTime(context.startDate, use24HourFormat)}
						{!context.isCompact && ` – ${formatTime(context.endDate, use24HourFormat)}`}
					</span>

					{taskLabel && !context.isCompact && (
						<span className="truncate leading-tight opacity-60">{taskLabel}</span>
					)}
				</>
			)
		case 'month':
			return (
				<>
					<span className={cn('size-1.5 shrink-0 rounded-full', PLAN_DOT[plan.color])} />
					<span className="shrink-0 text-muted-foreground tabular-nums">
						{formatTime(context.startDate, use24HourFormat)}
					</span>
					<span className="truncate font-medium">{plan.title}</span>
				</>
			)
		case 'agenda':
			return (
				<>
					<div className="flex items-baseline justify-between gap-3">
						<span className="flex items-center gap-1 truncate text-sm font-medium">
							{plan.confirmedAt && <CircleCheck className="size-3.5 shrink-0 opacity-70" />}
							<span className="truncate">{plan.title}</span>
						</span>
						<span className="shrink-0 text-xs tabular-nums opacity-70">
							{formatTime(context.startDate, use24HourFormat)} –{' '}
							{formatTime(context.endDate, use24HourFormat)}
						</span>
					</div>

					<div className="flex items-baseline justify-between gap-3">
						<span className="truncate text-xs opacity-70">{taskLabel ?? plan.description}</span>
						<span className="shrink-0 text-xs opacity-60">
							{formatDuration(context.startDate, context.endDate)}
						</span>
					</div>
				</>
			)
		case 'all-day':
			return plan.title
	}
}
