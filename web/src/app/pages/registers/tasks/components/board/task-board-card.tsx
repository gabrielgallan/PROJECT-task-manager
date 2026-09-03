import { format } from 'date-fns'
import { CalendarDays, Info, InfoIcon, TriangleAlert } from 'lucide-react'
import { TaskPriorityBadge } from '@/app/pages/registers/tasks/components/list/task-priority-badge'
import { TaskActionsMenu } from '@/app/pages/registers/tasks/components/task-actions-menu'
import { KanbanCard } from '@/components/kibo-ui/kanban'
import type { TaskBoardCard as TBoardCard } from '@/features/tasks/model/task-board'
import { isTaskDueSoon, isTaskLate } from '@/features/tasks/model/task-due-date'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'

/** Late shouts, close whispers, everything else is just a date. */
function getDueDateIcon(isLate: boolean, isDueSoon: boolean) {
	if (isLate) {
		return TriangleAlert
	}

	return isDueSoon ? Info : CalendarDays
}

interface ITaskBoardCardProps {
	card: TBoardCard
	onDetails: (task: Task) => void
	onStatusChange: (task: Task, status: TaskStatus) => void
	onEdit: (task: Task) => void
	onPlan: (task: Task) => void
	onLogWork: (task: Task) => void
	onDelete: (task: Task) => void
}

export function TaskBoardCard({ card, onDetails, ...actions }: ITaskBoardCardProps) {
	const { task } = card

	const isDone = task.status === 'DONE'
	const isLate = isTaskLate(task)
	const isDueSoon = isTaskDueSoon(task)

	const _DueIcon = getDueDateIcon(isLate, isDueSoon)

	return (
		<KanbanCard
			id={card.id}
			name={card.name}
			column={card.column}
			className="gap-0 rounded-lg p-3 shadow-none"
		>
			<div className="relative">
				{/* Reading comes before acting on a board, so the card itself opens the
				    details sheet. It is a single button rather than a clickable box so
				    the keyboard reaches it without competing with the drag handle. */}
				<button
					type="button"
					onClick={() => onDetails(task)}
					className="flex w-full flex-col gap-3 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					<div className="flex flex-col gap-8">
						<p
							className={cn(['line-clamp-2 pr-6 font-medium text-sm', `${isDone && 'opacity-30'}`])}
						>
							{task.title}
						</p>

						<div className="flex justify-between">
							<TaskPriorityBadge priority={task.priority} />

							{task.dueDate && (
								<div
									className={cn([
										'flex items-center gap-1 text-muted-foreground text-xs',
										`${isLate && 'text-destructive'}`,
									])}
								>
									{isLate && <TriangleAlert className="text-destructive size-3" />}
									{isDueSoon && <InfoIcon className="text-muted-foreground size-3" />}

									<span>{task.startDate ? format(task.startDate, 'MMM dd') : 'Without start'}</span>
									{'-'}
									<span>{format(task.dueDate, 'MMM dd, yyyy')}</span>
								</div>
							)}
						</div>
					</div>
				</button>

				{/* Sits outside the button so the menu is not nested in it, and out of
				    the drag sensor so pressing it never starts a drag. */}
				<div data-dnd-ignore className="absolute -top-1 -right-1">
					<TaskActionsMenu task={task} onDetails={onDetails} {...actions} />
				</div>
			</div>
		</KanbanCard>
	)
}
