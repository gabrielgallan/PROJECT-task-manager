import { differenceInCalendarDays, format, formatDistanceToNowStrict } from 'date-fns'
import { Calendar, CircleCheck, EllipsisVertical, Info, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TableCell, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Task } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'
import { TaskPriorityBadge } from './task-priority-badge'
import { TaskStatusBadge } from './task-status-badge'

interface TasksTableRowProps {
	task: Task
}

function isDueWithinOneWeek(dueDate: Date) {
	const daysUntilDue = differenceInCalendarDays(dueDate, new Date())

	return daysUntilDue >= 0 && daysUntilDue <= 7
}

export function TasksTableRow({ task }: TasksTableRowProps) {
	let rowClass: string = ''
	let isLate: boolean = false
	let isNearDueDate: boolean = false

	if (task.status !== 'done' && task.dueDate) {
		isNearDueDate = isDueWithinOneWeek(task.dueDate)
	}

	if (task.status === 'done') {
		rowClass = 'opacity-35'
	}

	if (task.status !== 'done' && task.dueDate && task.dueDate < new Date()) {
		isLate = true
	}

	return (
		<TableRow className={cn([rowClass])}>
			<TableCell>
				<p className="max-w-66 truncate font-medium">{task.title}</p>
			</TableCell>

			<TableCell>
				<TaskStatusBadge status={task.status} />
			</TableCell>

			<TableCell>
				<TaskPriorityBadge priority={task.priority} />
			</TableCell>

			<TableCell className="text-right">
				<span className="text-muted-foreground">
					{formatDistanceToNowStrict(task.updatedAt, {
						addSuffix: true,
					})}
				</span>
			</TableCell>

			<TableCell className="flex justify-end items-center">
				{task.dueDate ? (
					<div className="flex gap-2 items-center">
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
								<TooltipTrigger render={<Info className="size-4 text-slate-500" />} />

								<TooltipContent>
									<p>Due within a week</p>
								</TooltipContent>
							</Tooltip>
						)}

						<span>{format(task.dueDate, `PPP`)}</span>
					</div>
				) : (
					'-'
				)}
			</TableCell>

			<TableCell className="text-right">
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="ghost" size="icon-xs">
							<EllipsisVertical className="size-3" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent className="w-fit">
						<DropdownMenuGroup>
							<DropdownMenuLabel>Actions</DropdownMenuLabel>

							<DropdownMenuItem>
								<div className="flex gap-2 items-center">
									<CircleCheck />
									Mark as done
								</div>
							</DropdownMenuItem>

							<DropdownMenuItem>
								<div className="flex gap-2 items-center">
									<Calendar />
									Plan
								</div>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	)
}
