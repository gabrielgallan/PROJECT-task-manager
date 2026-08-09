import { ListFilter, X } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Task } from '@/features/tasks/model/task-types'

import { NO_TASK_REPORT_FILTER } from '../model/work-log-report'

interface IReportTaskFilterProps {
	tasks: Task[]
	selectedTaskIds: string[]
	onToggle: (taskId: string) => void
	onClear: () => void
}

export function ReportTaskFilter({
	tasks,
	selectedTaskIds,
	onToggle,
	onClear,
}: IReportTaskFilterProps) {
	const [open, setOpen] = useState(false)
	const hasSelection = selectedTaskIds.length > 0

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger render={<Button variant="outline" size="sm" />}>
				<ListFilter />
				<span>{hasSelection ? 'Tasks' : 'All tasks'}</span>
				{hasSelection && (
					<Badge variant="secondary" className="ml-0.5">
						{selectedTaskIds.length}
					</Badge>
				)}
			</PopoverTrigger>

			<PopoverContent align="start" className="w-72 gap-0 p-0">
				<Command>
					<CommandInput placeholder="Search tasks..." />
					<CommandList>
						<CommandEmpty>No tasks found.</CommandEmpty>
						<CommandGroup heading="Include">
							<CommandItem
								value="No task"
								data-checked={selectedTaskIds.includes(NO_TASK_REPORT_FILTER)}
								onSelect={() => onToggle(NO_TASK_REPORT_FILTER)}
							>
								<span className="text-muted-foreground">No task</span>
							</CommandItem>

							{tasks.map((task) => (
								<CommandItem
									key={task.id}
									value={`${task.title} ${task.id}`}
									data-checked={selectedTaskIds.includes(task.id)}
									onSelect={() => onToggle(task.id)}
								>
									<span className="truncate">{task.title}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>

					<div className="border-t p-1">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-full justify-start"
							disabled={!hasSelection}
							onClick={onClear}
						>
							<X />
							Clear task filter
						</Button>
					</div>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
