import { CalendarPlus, Clock, EllipsisVertical, PanelRight, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	canLogWorkForTask,
	canPlanTask,
	TASK_TRANSITIONS,
} from '@/features/tasks/model/task-transitions'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'
import { useTaskPending } from '@/features/tasks/hooks/use-task-pending'

interface ITaskActionsMenuProps {
	task: Task
	onStatusChange: (task: Task, status: TaskStatus) => void
	onDetails: (task: Task) => void
	onEdit: (task: Task) => void
	onPlan: (task: Task) => void
	onLogWork: (task: Task) => void
	onDelete: (task: Task) => void
}

/**
 * Two blocks on purpose. The top one changes with the status and covers the
 * one-click case; the bottom one never moves, so "Edit" and "Delete" always sit
 * where the pointer expects them. "Details" sits above both, since reading comes
 * before acting and it must not push the rest around either.
 */
export function TaskActionsMenu({
	task,
	onStatusChange,
	onDetails,
	onEdit,
	onPlan,
	onLogWork,
	onDelete,
}: ITaskActionsMenuProps) {
	const transitions = TASK_TRANSITIONS[task.status]
	const pending = useTaskPending(task.id)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" disabled={pending} />}>
				<EllipsisVertical className="size-3" />
				<span className="sr-only">Actions for {task.title}</span>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-44">
				<DropdownMenuItem onClick={() => onDetails(task)}>
					<PanelRight />
					Details
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					<DropdownMenuLabel>Status</DropdownMenuLabel>

					{transitions.map(({ to, label, icon: Icon }) => (
						<DropdownMenuItem key={to} disabled={pending} onClick={() => onStatusChange(task, to)}>
							<Icon />
							{label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					<DropdownMenuItem disabled={pending} onClick={() => onEdit(task)}>
						<Pencil />
						Edit
					</DropdownMenuItem>

					{canPlanTask(task.status) && (
						<DropdownMenuItem onClick={() => onPlan(task)}>
							<CalendarPlus />
							Plan
						</DropdownMenuItem>
					)}

					{canLogWorkForTask(task.status) && (
						<DropdownMenuItem onClick={() => onLogWork(task)}>
							<Clock />
							Log work
						</DropdownMenuItem>
					)}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuItem variant="destructive" disabled={pending} onClick={() => onDelete(task)}>
					<Trash2 />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
