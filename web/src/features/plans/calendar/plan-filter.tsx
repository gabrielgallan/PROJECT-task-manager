import { Check, ListFilter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import type { Task } from '@/features/tasks/model/task-types'

/** Sentinel for plans made without a task, which are a first-class case. */
export const NO_TASK_FILTER = 'none'

interface IPlanFilterProps {
	tasks: Task[]
	selectedTaskIds: string[]
	onToggle: (taskId: string) => void
	onClear: () => void
}

export function PlanFilter({ tasks, selectedTaskIds, onToggle, onClear }: IPlanFilterProps) {
	const hasFilters = selectedTaskIds.length > 0

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
				<ListFilter />
				<span className="max-md:sr-only">Filter</span>
				{hasFilters && (
					<Badge variant="secondary" className="ml-1">
						{selectedTaskIds.length}
					</Badge>
				)}
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Task</DropdownMenuLabel>

					<DropdownMenuItem
						closeOnClick={false}
						onClick={() => onToggle(NO_TASK_FILTER)}
						className="justify-between"
					>
						<span className="text-muted-foreground">No task</span>
						{selectedTaskIds.includes(NO_TASK_FILTER) && <Check className="size-4" />}
					</DropdownMenuItem>

					{tasks.map((task) => (
						<DropdownMenuItem
							key={task.id}
							closeOnClick={false}
							onClick={() => onToggle(task.id)}
							className="justify-between gap-2"
						>
							<span className="truncate">{task.title}</span>
							{selectedTaskIds.includes(task.id) && <Check className="size-4 shrink-0" />}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />
				<DropdownMenuItem disabled={!hasFilters} onClick={onClear}>
					Clear filters
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
