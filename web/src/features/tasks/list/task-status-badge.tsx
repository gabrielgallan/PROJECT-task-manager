import { CircleCheck, CircleDashed, SquircleDashed } from 'lucide-react'
import type { TaskStatus } from '@/features/tasks/model/task-types'

interface TaskStatusBadgeProps {
	status: TaskStatus
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
	switch (status) {
		case 'backlog':
			return (
				<div className="flex items-center gap-2 px-2 py-0.5 border rounded-2xl w-fit">
					<SquircleDashed className="size-2.5 text-slate-500" />
					<span className="text-xs text-muted-foreground">Backlog</span>
				</div>
			)
		case 'in_progress':
			return (
				<div className="flex items-center gap-2 px-2 py-0.5 border rounded-2xl w-fit">
					<CircleDashed className="size-2.5 text-amber-500" />
					<span className="text-xs text-muted-foreground">In progress</span>
				</div>
			)
		case 'done':
			return (
				<div className="flex items-center gap-2 px-2 py-0.5 border rounded-2xl w-fit">
					<CircleCheck className="size-2.5 fill-emerald-500 stroke-emerald-500 [&>path]:stroke-background" />
					<span className="text-xs text-muted-foreground">Done</span>
				</div>
			)
		default:
			return
	}
}
