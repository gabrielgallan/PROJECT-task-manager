import { CalendarRange } from 'lucide-react'
import { useMemo, useState } from 'react'
import { TaskGanttBar } from '@/app/pages/registers/tasks/components/gantt/task-gantt-bar'
import {
	DEFAULT_GANTT_RANGE,
	DEFAULT_GANTT_ZOOM,
	MAX_GANTT_ZOOM,
	MIN_GANTT_ZOOM,
} from '@/app/pages/registers/tasks/components/gantt/tasks-gantt-constants'
import { TasksGanttToolbar } from '@/app/pages/registers/tasks/components/gantt/tasks-gantt-toolbar'
import {
	GanttFeatureItem,
	GanttFeatureList,
	GanttFeatureListGroup,
	GanttHeader,
	GanttProvider,
	GanttSidebar,
	GanttSidebarGroup,
	GanttSidebarItem,
	GanttTimeline,
	GanttToday,
	type Range,
} from '@/components/kibo-ui/gantt'
import { Button } from '@/components/ui/button'
import { buildTaskGanttData } from '@/features/tasks/model/task-gantt'
import type { Task } from '@/features/tasks/model/task-types'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface ITasksGanttProps {
	tasks: Task[]
	onReschedule: (task: Task, startDate: Date, dueDate: Date) => Promise<boolean>
	onSelectTask: (task: Task) => void
	onClearFilters?: () => void
	isFiltered?: boolean
}

export function TasksGantt({
	tasks,
	onReschedule,
	onSelectTask,
	onClearFilters,
	isFiltered = false,
}: ITasksGanttProps) {
	const [range, setRange] = useState<Range>(DEFAULT_GANTT_RANGE)
	const [zoom, setZoom] = useState(DEFAULT_GANTT_ZOOM)
	const [pendingId, setPendingId] = useState<string | null>(null)
	const [revisions, setRevisions] = useState<Record<string, number>>({})
	const isMobile = useIsMobile()

	const { groups, undatedTasks } = useMemo(() => buildTaskGanttData(tasks), [tasks])

	// The timeline opens around today, which is the reference for every deadline.
	const [focusDate] = useState(() => new Date())

	const selectTaskById = (id: string) => {
		const task = tasks.find((item) => item.id === id)

		if (task) {
			onSelectTask(task)
		}
	}

	const rescheduleTask = async (id: string, startAt: Date, endAt: Date | null) => {
		const task = tasks.find((item) => item.id === id)

		if (!task || !endAt) {
			return
		}

		setPendingId(id)
		try {
			await onReschedule(task, startAt, endAt)
		} finally {
			setPendingId(null)
			setRevisions((previous) => ({ ...previous, [id]: (previous[id] ?? 0) + 1 }))
		}
	}

	const changeZoom = (value: number) => {
		setZoom(Math.min(MAX_GANTT_ZOOM, Math.max(MIN_GANTT_ZOOM, value)))
	}

	return (
		<div className="styled-scrollbar flex min-h-0 flex-1 flex-col">
			<TasksGanttToolbar
				range={range}
				zoom={zoom}
				undatedTasks={undatedTasks}
				onRangeChange={setRange}
				onZoomChange={changeZoom}
				onSelectTask={onSelectTask}
			/>

			<div className="min-h-0 flex-1">
				{groups.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
						<div className="flex size-10 items-center justify-center rounded-md bg-muted">
							<CalendarRange className="size-5 text-muted-foreground" />
						</div>

						<div className="space-y-1">
							<p className="font-medium">Nothing to place on the timeline</p>

							<p className="text-sm text-muted-foreground">
								{isFiltered
									? 'No task matches the filters, or none of the matches has a due date.'
									: 'Tasks appear here once they have a due date.'}
							</p>
						</div>

						{isFiltered && onClearFilters && (
							<Button variant="outline" size="sm" onClick={onClearFilters}>
								Clear filters
							</Button>
						)}
					</div>
				) : (
					/* Remounting per viewport, range and zoom re-anchors the view on the focus date. */
					<GanttProvider
						key={`${isMobile ? 'mobile' : 'desktop'}-${range}-${zoom}`}
						range={range}
						zoom={zoom}
						initialScrollDate={focusDate}
					>
						{!isMobile && (
							<GanttSidebar label="Tasks">
								{groups.map((group) => (
									<GanttSidebarGroup key={group.status} name={group.name}>
										{group.features.map((feature) => (
											<GanttSidebarItem
												key={feature.id}
												feature={feature}
												onSelectItem={selectTaskById}
												className={feature.task.status === 'DONE' ? 'opacity-50' : undefined}
											/>
										))}
									</GanttSidebarGroup>
								))}
							</GanttSidebar>
						)}

						<GanttTimeline>
							<GanttHeader />

							<GanttFeatureList>
								{groups.map((group) => (
									<GanttFeatureListGroup key={group.status}>
										{group.features.map((feature) => (
											<GanttFeatureItem
												key={`${feature.id}-${feature.startAt.toISOString()}-${feature.endAt?.toISOString()}-${revisions[feature.id] ?? 0}`}
												{...feature}
												onMove={pendingId === feature.id ? undefined : rescheduleTask}
												className={cn([
													// Short tasks collapse to a few pixels on the wider ranges.
													'[&>div]:min-w-6',
													feature.task.status === 'DONE' && 'opacity-50',
												])}
											>
												<TaskGanttBar task={feature.task} />
											</GanttFeatureItem>
										))}
									</GanttFeatureListGroup>
								))}
							</GanttFeatureList>

							<GanttToday />
						</GanttTimeline>
					</GanttProvider>
				)}
			</div>
		</div>
	)
}
