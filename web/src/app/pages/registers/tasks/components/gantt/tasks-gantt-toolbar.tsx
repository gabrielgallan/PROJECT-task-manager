import {
	CalendarDays,
	CalendarFold,
	CalendarOff,
	CalendarRange,
	ZoomIn,
	ZoomOut,
} from 'lucide-react'
import {
	MAX_GANTT_ZOOM,
	MIN_GANTT_ZOOM,
} from '@/app/pages/registers/tasks/components/gantt/tasks-gantt-constants'
import { TaskStatusBadge } from '@/app/pages/registers/tasks/components/list/task-status-badge'
import type { Range } from '@/components/kibo-ui/gantt'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TASK_PRIORITIES, TASK_PRIORITY_COLOR } from '@/features/tasks/model/task-priority'
import type { Task } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'

const RANGE_OPTIONS: Record<Range, { label: string; icon: typeof CalendarDays }> = {
	daily: { label: 'Day', icon: CalendarDays },
	monthly: { label: 'Month', icon: CalendarRange },
	quarterly: { label: 'Quarter', icon: CalendarFold },
}

interface IUndatedTasksProps {
	tasks: Task[]
	onSelectTask: (task: Task) => void
}

/**
 * Tasks without a due date cannot be drawn, and silently dropping them is how
 * they get forgotten. The popover turns the count into the place where they are
 * given a date.
 */
function UndatedTasks({ tasks, onSelectTask }: IUndatedTasksProps) {
	return (
		<Popover>
			<PopoverTrigger render={<Button variant="ghost" size="sm" />}>
				<CalendarOff />
				{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} without due date
			</PopoverTrigger>

			<PopoverContent align="start" className="w-80">
				<PopoverHeader>
					<PopoverTitle>Not on the timeline</PopoverTitle>

					<PopoverDescription>
						A due date is what places a task here. Open one to give it a deadline.
					</PopoverDescription>
				</PopoverHeader>

				<Separator />

				<ul className="styled-scrollbar -mx-1 max-h-64 overflow-y-auto px-1">
					{tasks.map((task) => (
						<li key={task.id}>
							<button
								type="button"
								onClick={() => onSelectTask(task)}
								className="flex w-full items-center justify-between gap-2 rounded-md p-1.5 text-left outline-none hover:bg-accent focus-visible:bg-accent"
							>
								<span className="truncate text-sm">{task.title}</span>

								<TaskStatusBadge status={task.status} />
							</button>
						</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	)
}

/** The bars only carry a colour dot, so the palette needs to be spelled out. */
function PriorityLegend() {
	return (
		<div className="flex items-center gap-2 text-xs text-muted-foreground">
			{TASK_PRIORITIES.map((priority) => (
				<span key={priority} className="flex items-center gap-1">
					<span className={cn(['block size-1.5 rounded-xs', TASK_PRIORITY_COLOR[priority]])} />
					<span className="capitalize max-lg:sr-only">{priority}</span>
				</span>
			))}
		</div>
	)
}

interface ITasksGanttToolbarProps {
	range: Range
	zoom: number
	undatedTasks: Task[]
	onRangeChange: (range: Range) => void
	onZoomChange: (zoom: number) => void
	onSelectTask: (task: Task) => void
}

export function TasksGanttToolbar({
	range,
	zoom,
	undatedTasks,
	onRangeChange,
	onZoomChange,
	onSelectTask,
}: ITasksGanttToolbarProps) {
	return (
		<header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
			<div className="flex items-center gap-2">
				<span className="text-sm font-semibold">Delivery timeline</span>

				{undatedTasks.length > 0 && (
					<UndatedTasks tasks={undatedTasks} onSelectTask={onSelectTask} />
				)}
			</div>

			<div className="flex items-center gap-3">
				<PriorityLegend />

				<Separator orientation="vertical" className="h-4" />

				<div className="flex items-center">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Zoom out"
						disabled={zoom <= MIN_GANTT_ZOOM}
						onClick={() => onZoomChange(zoom - 25)}
					>
						<ZoomOut />
					</Button>

					<span className="w-11 text-center text-xs text-muted-foreground tabular-nums">
						{zoom}%
					</span>

					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Zoom in"
						disabled={zoom >= MAX_GANTT_ZOOM}
						onClick={() => onZoomChange(zoom + 25)}
					>
						<ZoomIn />
					</Button>
				</div>

				<Tabs value={range} onValueChange={(value) => onRangeChange(value as Range)}>
					<TabsList>
						{(Object.keys(RANGE_OPTIONS) as Range[]).map((value) => {
							const { label, icon: Icon } = RANGE_OPTIONS[value]

							return (
								<TabsTrigger key={value} value={value} className="gap-1.5">
									<Icon className="size-4" />
									<span className="max-md:sr-only">{label}</span>
								</TabsTrigger>
							)
						})}
					</TabsList>
				</Tabs>
			</div>
		</header>
	)
}
