import { CATEGORY_DOT, type TCategoryColor } from '@/features/categories/model/category-colors'
import { useCalendar } from '@/features/calendar/calendar-provider'
import { formatDuration, formatTime } from '@/features/calendar/lib/formatting'
import type { ICalendarItemRenderContext } from '@/features/calendar/types'
import { WORK_LOG_SURFACE } from '@/features/work-logs/model/work-log-colors'
import type { IWorkLog } from '@/features/work-logs/model/work-log-types'
import { cn } from '@/lib/utils'

interface IWorkLogItemContentProps {
	workLog: IWorkLog
	color: TCategoryColor
	context: ICalendarItemRenderContext
	taskTitle?: string
}

export function getWorkLogItemClassName(
	color: TCategoryColor,
	context: ICalendarItemRenderContext,
): string {
	return context.variant === 'month' ? '' : WORK_LOG_SURFACE[color]
}

export function WorkLogItemContent({ workLog, color, context, taskTitle }: IWorkLogItemContentProps) {
	const { use24HourFormat } = useCalendar()
	// A log often carries the task's own name; repeating it adds nothing.
	const taskLabel = taskTitle && taskTitle !== workLog.title ? taskTitle : undefined

	switch (context.variant) {
		case 'time':
			return (
				<>
					<span className="truncate font-medium leading-tight">{workLog.title}</span>

					<span
						className={cn('truncate leading-tight opacity-70', context.isCompact && 'shrink-0')}
					>
						{formatTime(context.startDate, use24HourFormat)}
						{!context.isCompact && ` – ${formatTime(context.endDate, use24HourFormat)}`}
						{!context.isCompact && ` · ${formatDuration(context.startDate, context.endDate)}`}
					</span>

					{taskLabel && !context.isCompact && (
						<span className="truncate leading-tight opacity-60">{taskLabel}</span>
					)}
				</>
			)
		case 'month':
			return (
				<>
					<span className={cn('size-1.5 shrink-0 rounded-full', CATEGORY_DOT[color])} />
					<span className="shrink-0 text-muted-foreground tabular-nums">
						{formatTime(context.startDate, use24HourFormat)}
					</span>
					<span className="truncate font-medium">{workLog.title}</span>
				</>
			)
		case 'agenda':
			return (
				<>
					<div className="flex items-baseline justify-between gap-3">
						<span className="truncate text-sm font-medium">{workLog.title}</span>
						<span className="shrink-0 text-xs tabular-nums opacity-70">
							{formatTime(context.startDate, use24HourFormat)} –{' '}
							{formatTime(context.endDate, use24HourFormat)}
						</span>
					</div>

					<div className="flex items-baseline justify-between gap-3">
						<span className="truncate text-xs opacity-70">{taskLabel ?? workLog.description}</span>
						<span className="shrink-0 text-xs opacity-60">
							{formatDuration(context.startDate, context.endDate)}
						</span>
					</div>
				</>
			)
		case 'all-day':
			return workLog.title
	}
}
