import { useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
	WorkLogsCalendar,
	type WorkLogsCalendarHandle,
} from '@/app/pages/registers/work-logs/components/work-logs-calendar'
import { BrowserTitle } from '@/components/browser-title'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCategories } from '@/features/categories/store/categories-store'
import { TaskSourceAlert } from '@/features/tasks/components/task-source-alert'
import { taskIdSchema } from '@/features/tasks/model/task-schema'
import { useTasks } from '@/features/tasks/store/tasks-store'
import { useCreateAction } from '@/hooks/use-create-action'

/** How the tasks page hands a task over when opening this one. */
const TASK_PARAM = 'task'

export function WorkLogsPage() {
	const [searchParams] = useSearchParams()
	const calendarRef = useRef<WorkLogsCalendarHandle>(null)
	const taskSource = useTasks()
	const { tasks } = taskSource
	const categorySource = useCategories()
	const { categories, uncategorizedColor } = categorySource
	const openCreateDialog = useCallback(() => calendarRef.current?.openCreate(), [])

	useCreateAction(openCreateDialog)

	const initialTaskIds = useMemo(() => {
		const taskId = searchParams.get(TASK_PARAM)
		return taskId && taskIdSchema.safeParse(taskId).success ? [taskId] : undefined
	}, [searchParams])

	return (
		<>
			<BrowserTitle title="Work logs" />
			<TaskSourceAlert
				error={taskSource.error}
				loading={taskSource.isPending}
				onRetry={() => void taskSource.refetch()}
			/>
			{categorySource.isPending && (
				<p role="status" className="px-4 pt-3 text-sm text-muted-foreground">
					Loading categories…
				</p>
			)}
			{categorySource.error && (
				<Alert variant="destructive">
					<AlertDescription>
						Categories could not be loaded. Work logs without a category remain available.{' '}
						<button
							type="button"
							className="underline"
							onClick={() => void categorySource.refetch()}
						>
							Try again
						</button>
					</AlertDescription>
				</Alert>
			)}

			<div className="flex min-h-0 flex-1 flex-col">
				<WorkLogsCalendar
					ref={calendarRef}
					tasks={tasks}
					categories={categories}
					uncategorizedColor={uncategorizedColor}
					initialTaskIds={initialTaskIds}
				/>
			</div>
		</>
	)
}
