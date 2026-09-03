import { format, formatDistanceToNowStrict } from 'date-fns'
import { Info, TriangleAlert } from 'lucide-react'
import { TaskActionsMenu } from '@/app/pages/registers/tasks/components/task-actions-menu'
import { TableCell, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { isTaskDueSoon, isTaskLate } from '@/features/tasks/model/task-due-date'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'
import { TaskPriorityBadge } from './task-priority-badge'
import { TaskStatusBadge } from './task-status-badge'

interface ITasksTableRowProps {
	task: Task
	onStatusChange: (task: Task, status: TaskStatus) => void
	onDetails: (task: Task) => void
	onEdit: (task: Task) => void
	onPlan: (task: Task) => void
	onLogWork: (task: Task) => void
	onDelete: (task: Task) => void
}

export function TasksTableRow({ task, onEdit, ...actions }: ITasksTableRowProps) {
	const isDone = task.status === 'DONE'
	const isLate = isTaskLate(task)
	const isNearDueDate = isTaskDueSoon(task)

	return (
		<TableRow className={cn([isDone && 'text-muted-foreground'])}>
			<TableCell>
				{/* The title is the way into the task, from the row and from the keyboard. */}
				<Tooltip>
					<TooltipTrigger
						render={
							<button
								type="button"
								onClick={() => onEdit(task)}
								className={cn([
									'max-w-66 truncate rounded-sm text-left font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50',
								])}
							/>
						}
					>
						{task.title}
					</TooltipTrigger>

					<TooltipContent>{task.title}</TooltipContent>
				</Tooltip>
			</TableCell>

			<TableCell>
				<TaskStatusBadge status={task.status} />
			</TableCell>

			<TableCell>
				<TaskPriorityBadge priority={task.priority} />
			</TableCell>

			<TableCell className="text-right">
				<span className="text-muted-foreground">
					{task.updatedAt ? formatDistanceToNowStrict(task.updatedAt, {
						addSuffix: true,
					}) : '—'}
				</span>
			</TableCell>

			<TableCell>
				{task.dueDate ? (
					<div className="flex items-center justify-end">
						{isLate && (
							<Tooltip>
								<TooltipTrigger render={<TriangleAlert className="size-4 text-destructive" />} />

								<TooltipContent>
									<p>Overdue</p>
								</TooltipContent>
							</Tooltip>
						)}

						{isNearDueDate && (
							<Tooltip>
								<TooltipTrigger render={<Info className="size-4 text-muted-foreground" />} />

								<TooltipContent>
									<p>Due within a week</p>
								</TooltipContent>
							</Tooltip>
						)}

						{/* Overdue has to be readable while scanning the column, not only on hover. */}
						<span className={cn(['ml-2 text-right'])}>{format(task.dueDate, 'dd/MM/yy')}</span>
					</div>
				) : (
					<p className="text-right text-muted-foreground">-</p>
				)}
			</TableCell>

			<TableCell className="text-right">
				<TaskActionsMenu task={task} onEdit={onEdit} {...actions} />
			</TableCell>
		</TableRow>
	)
}
