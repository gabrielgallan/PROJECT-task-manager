import { useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
	WorkLogsCalendar,
	type WorkLogsCalendarHandle,
} from '@/app/pages/registers/work-logs/components/work-logs-calendar'
import { BrowserTitle } from '@/components/browser-title'
import { useCategories } from '@/features/categories/store/categories-store'
import { useTasks } from '@/features/tasks/store/tasks-store'
import { TaskSourceAlert } from '@/features/tasks/components/task-source-alert'
import { useWorkLogs } from '@/features/work-logs/store/work-logs-store'
import { useCreateAction } from '@/hooks/use-create-action'

/** How the tasks page hands a task over when opening this one. */
const TASK_PARAM = 'task'

export function WorkLogsPage() {
	const [searchParams] = useSearchParams()
	const calendarRef = useRef<WorkLogsCalendarHandle>(null)
	const taskSource = useTasks()
	const { tasks } = taskSource
	const { categories, uncategorizedColor } = useCategories()
	const { workLogs, addWorkLog, updateWorkLog, removeWorkLog } = useWorkLogs()
	const openCreateDialog = useCallback(() => calendarRef.current?.openCreate(), [])

	useCreateAction(openCreateDialog)

	// An unknown id would filter every log out and read as an empty calendar, so
	// the link only takes effect for a task that is actually there.
	const initialTaskIds = useMemo(() => {
		const taskId = searchParams.get(TASK_PARAM)

		return taskId && tasks.some((task) => task.id === taskId) ? [taskId] : undefined
	}, [searchParams, tasks])

	return (
		<>
			<BrowserTitle title="Work logs" />
			<TaskSourceAlert error={taskSource.error} loading={taskSource.isPending} onRetry={() => void taskSource.refetch()} />

			<div className="flex min-h-0 flex-1 flex-col">
				<WorkLogsCalendar
					ref={calendarRef}
					workLogs={workLogs}
					tasks={tasks}
					categories={categories}
					uncategorizedColor={uncategorizedColor}
					initialTaskIds={initialTaskIds}
					onCreate={addWorkLog}
					onUpdate={updateWorkLog}
					onDelete={removeWorkLog}
				/>
			</div>
		</>
	)
}
