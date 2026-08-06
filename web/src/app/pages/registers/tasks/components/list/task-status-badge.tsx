import {
	TASK_STATUS_ICON,
	TASK_STATUS_ICON_COLOR,
	TASK_STATUS_LABEL,
} from '@/features/tasks/model/task-status'
import type { TaskStatus } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'

interface TaskStatusBadgeProps {
	status: TaskStatus
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
	const Icon = TASK_STATUS_ICON[status]

	return (
		<div className="flex items-center gap-2 px-2 py-0.5 border rounded-2xl w-fit">
			<Icon className={cn(['size-2.5', TASK_STATUS_ICON_COLOR[status]])} />
			<span className="text-xs text-muted-foreground">{TASK_STATUS_LABEL[status]}</span>
		</div>
	)
}
