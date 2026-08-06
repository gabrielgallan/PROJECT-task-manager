import { BrowserTitle } from '@/components/browser-title'
import { TasksGantt } from '@/app/pages/registers/tasks/components/gantt/tasks-gantt'
import { TASKS_MOCK } from '@/features/tasks/mocks/tasks'

export function GanttTestPage() {
	return (
		<>
			<BrowserTitle title="Gantt (test)" />

			<div className="styled-scrollbar flex min-h-0 flex-1 flex-col">
				<TasksGantt tasks={TASKS_MOCK} />
			</div>
		</>
	)
}
