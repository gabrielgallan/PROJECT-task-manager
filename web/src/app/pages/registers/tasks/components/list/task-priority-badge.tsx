import { TASK_PRIORITY_COLOR, TASK_PRIORITY_LABEL } from '@/features/tasks/model/task-priority'
import type { TaskPriority } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'

interface TaskPriorityBadgeProps {
	priority: TaskPriority
}

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
	return (
		<div className="flex items-center gap-2">
			<span className={cn(['block size-1.5 rounded-xs', TASK_PRIORITY_COLOR[priority]])} />
			<span className="text-sm">{TASK_PRIORITY_LABEL[priority]}</span>
		</div>
	)
}
