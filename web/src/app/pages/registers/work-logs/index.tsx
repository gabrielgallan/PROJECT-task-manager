import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { WorkLogsCalendar } from '@/app/pages/registers/work-logs/components/work-logs-calendar'
import { BrowserTitle } from '@/components/browser-title'
import { useTasks } from '@/features/tasks/store/tasks-store'
import { useWorkLogs } from '@/features/work-logs/store/work-logs-store'

/** How the tasks page hands a task over when opening this one. */
const TASK_PARAM = 'task'

export function WorkLogsPage() {
	const [searchParams] = useSearchParams()
	const { tasks } = useTasks()
	const { workLogs, addWorkLog, updateWorkLog, removeWorkLog } = useWorkLogs()

	// An unknown id would filter every log out and read as an empty calendar, so
	// the link only takes effect for a task that is actually there.
	const initialTaskIds = useMemo(() => {
		const taskId = searchParams.get(TASK_PARAM)

		return taskId && tasks.some((task) => task.id === taskId) ? [taskId] : undefined
	}, [searchParams, tasks])

	return (
		<>
			<BrowserTitle title="Work logs" />

			<div className="flex min-h-0 flex-1 flex-col">
				<WorkLogsCalendar
					workLogs={workLogs}
					tasks={tasks}
					initialTaskIds={initialTaskIds}
					onCreate={addWorkLog}
					onUpdate={updateWorkLog}
					onDelete={removeWorkLog}
				/>
			</div>
		</>
	)
}
