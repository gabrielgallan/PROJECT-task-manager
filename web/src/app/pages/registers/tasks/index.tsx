import { TasksGantt } from '@/app/pages/registers/tasks/components/gantt/tasks-gantt'
import { TasksList } from '@/app/pages/registers/tasks/components/list/tasks-list'
import { BrowserTitle } from '@/components/browser-title'
import { TASKS_MOCK } from '@/features/tasks/mocks/tasks'
import { DEFAULT_TASK_VIEW, TASK_VIEW_VALUES } from '@/features/tasks/model/task-views'
import { useViewParam } from '@/hooks/use-view-param'

export function TasksPage() {
	const [view] = useViewParam(TASK_VIEW_VALUES, DEFAULT_TASK_VIEW)

	return (
		<>
			<BrowserTitle title="Tasks" />

			{view === 'timeline' ? <TasksGantt tasks={TASKS_MOCK} /> : <TasksList tasks={TASKS_MOCK} />}
		</>
	)
}
