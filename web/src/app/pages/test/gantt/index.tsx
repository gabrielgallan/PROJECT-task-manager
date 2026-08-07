import { TasksGantt } from '@/app/pages/registers/tasks/components/gantt/tasks-gantt'
import { BrowserTitle } from '@/components/browser-title'
import { useTasks } from '@/features/tasks/store/tasks-store'

export function GanttTestPage() {
	const { tasks, rescheduleTask } = useTasks()

	return (
		<>
			<BrowserTitle title="Gantt (test)" />

			<div className="styled-scrollbar flex min-h-0 flex-1 flex-col">
				<TasksGantt
					tasks={tasks}
					onReschedule={(task, startDate, dueDate) =>
						rescheduleTask(task.id, startDate, dueDate)
					}
					onSelectTask={() => {}}
				/>
			</div>
		</>
	)
}
