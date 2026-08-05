import { BrowserTitle } from '@/components/browser-title'
import { TasksGantt } from '@/features/tasks/gantt/tasks-gantt'
import { TasksList } from '@/features/tasks/list/tasks-list'
import { TASKS_MOCK } from '@/features/tasks/mocks/tasks'
import { DEFAULT_TASK_VIEW, TASK_VIEW_VALUES } from '@/features/tasks/model/task-views'
import { useViewParam } from '@/hooks/use-view-param'

export function TasksPage() {
	const [view] = useViewParam(TASK_VIEW_VALUES, DEFAULT_TASK_VIEW)

	return (
		<>
			<BrowserTitle title="Manage Tasks" />

			{view === 'timeline' ? (
				<TasksGantt tasks={TASKS_MOCK} />
			) : (
				<TasksList tasks={TASKS_MOCK} />
			)}
		</>
	)
}
