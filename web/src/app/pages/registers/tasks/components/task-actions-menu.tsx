import { CalendarPlus, Clock, EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
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

interface ITaskActionsMenuProps {
	task: Task
	onStatusChange: (task: Task, status: TaskStatus) => void
	onEdit: (task: Task) => void
	onPlan: (task: Task) => void
	onLogWork: (task: Task) => void
	onDelete: (task: Task) => void
}

/**
 * Two blocks on purpose. The top one changes with the status and covers the
 * one-click case; the bottom one never moves, so "Edit" and "Delete" always sit
 * where the pointer expects them.
 */
export function TaskActionsMenu({
	task,
	onStatusChange,
	onEdit,
	onPlan,
	onLogWork,
	onDelete,
}: ITaskActionsMenuProps) {
	const transitions = TASK_TRANSITIONS[task.status]

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
				<EllipsisVertical className="size-3" />
				<span className="sr-only">Actions for {task.title}</span>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-44">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Status</DropdownMenuLabel>

					{transitions.map(({ to, label, icon: Icon }) => (
						<DropdownMenuItem key={to} onClick={() => onStatusChange(task, to)}>
							<Icon />
							{label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					<DropdownMenuItem onClick={() => onEdit(task)}>
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

				<DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
					<Trash2 />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
