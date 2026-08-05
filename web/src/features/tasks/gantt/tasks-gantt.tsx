import { useMemo, useState } from 'react'
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
import { TaskGanttBar } from '@/features/tasks/gantt/task-gantt-bar'
import {
	DEFAULT_GANTT_RANGE,
	DEFAULT_GANTT_ZOOM,
	MAX_GANTT_ZOOM,
	MIN_GANTT_ZOOM,
} from '@/features/tasks/gantt/tasks-gantt-constants'
import { TasksGanttToolbar } from '@/features/tasks/gantt/tasks-gantt-toolbar'
import { buildTaskGanttData } from '@/features/tasks/model/task-gantt'
import type { Task } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'

interface ITasksGanttProps {
	tasks: Task[]
}

export function TasksGantt({ tasks }: ITasksGanttProps) {
	const [allTasks, setAllTasks] = useState<Task[]>(tasks)
	const [range, setRange] = useState<Range>(DEFAULT_GANTT_RANGE)
	const [zoom, setZoom] = useState(DEFAULT_GANTT_ZOOM)

	const { groups, undatedTasks } = useMemo(() => buildTaskGanttData(allTasks), [allTasks])

	// The timeline opens around today, which is the reference for every deadline.
	const [focusDate] = useState(() => new Date())

	const rescheduleTask = (id: string, startAt: Date, endAt: Date | null) => {
		if (!endAt) {
			return
		}

		setAllTasks((previous) =>
			previous.map((task) =>
				task.id === id
					? { ...task, startDate: startAt, dueDate: endAt, updatedAt: new Date() }
					: task,
			),
		)
	}

	const changeZoom = (value: number) => {
		setZoom(Math.min(MAX_GANTT_ZOOM, Math.max(MIN_GANTT_ZOOM, value)))
	}

	return (
		<div className="styled-scrollbar flex min-h-0 flex-1 flex-col">
			<TasksGanttToolbar
				range={range}
				zoom={zoom}
				undatedCount={undatedTasks.length}
				onRangeChange={setRange}
				onZoomChange={changeZoom}
			/>

			<div className="min-h-0 flex-1">
				{/* Remounting per range and zoom re-anchors the view on the focus date. */}
				<GanttProvider
					key={`${range}-${zoom}`}
					range={range}
					zoom={zoom}
					initialScrollDate={focusDate}
				>
					<GanttSidebar label="Tasks">
						{groups.map((group) => (
							<GanttSidebarGroup key={group.status} name={group.name}>
								{group.features.map((feature) => (
									<GanttSidebarItem
										key={feature.id}
										feature={feature}
										className={feature.task.status === 'done' ? 'opacity-50' : undefined}
									/>
								))}
							</GanttSidebarGroup>
						))}
					</GanttSidebar>

					<GanttTimeline>
						<GanttHeader />

						<GanttFeatureList>
							{groups.map((group) => (
								<GanttFeatureListGroup key={group.status}>
									{group.features.map((feature) => (
										<GanttFeatureItem
											key={feature.id}
											{...feature}
											onMove={rescheduleTask}
											className={cn([
												// Short tasks collapse to a few pixels on the wider ranges.
												'[&>div]:min-w-6',
												feature.task.status === 'done' && 'opacity-50',
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
			</div>
		</div>
	)
}
