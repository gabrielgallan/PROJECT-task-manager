import { format } from 'date-fns'
import { TriangleAlert } from 'lucide-react'
import { TASK_PRIORITY_COLOR, TASK_PRIORITY_LABEL } from '@/features/tasks/model/task-priority'
import type { Task } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'

interface ITaskGanttBarProps {
	task: Task
}

export function TaskGanttBar({ task }: ITaskGanttBarProps) {
	const isLate = task.status !== 'DONE' && !!task.dueDate && task.dueDate < new Date()

	return (
		<>
			<span
				className={cn(['block size-1.5 shrink-0 rounded-xs', TASK_PRIORITY_COLOR[task.priority]])}
				title={`${TASK_PRIORITY_LABEL[task.priority]} priority`}
			/>

			<p className="flex-1 truncate text-xs">{task.title}</p>

			{isLate && <TriangleAlert className="size-3 shrink-0 text-destructive" />}

			{task.dueDate && (
				<span className="shrink-0 text-[10px] text-muted-foreground">
					{format(task.dueDate, 'dd MMM')}
				</span>
			)}
		</>
	)
}
