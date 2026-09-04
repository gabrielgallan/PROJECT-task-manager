import { useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BrowserTitle } from '@/components/browser-title'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCategories } from '@/features/categories/store/categories-store'
import { PlansCalendar, type PlansCalendarHandle } from '@/features/plans/calendar/plans-calendar'
import { planIdSchema } from '@/features/plans/model/plan-schema'
import { TaskSourceAlert } from '@/features/tasks/components/task-source-alert'
import { useTasks } from '@/features/tasks/store/tasks-store'
import { useCreateAction } from '@/hooks/use-create-action'

/** How the tasks page hands a task over when opening this one. */
const TASK_PARAM = 'task'

export function PlansPage() {
	const [searchParams] = useSearchParams()
	const calendarRef = useRef<PlansCalendarHandle>(null)
	const categorySource = useCategories()
	const { categories, uncategorizedColor } = categorySource
	const taskSource = useTasks()
	const { tasks } = taskSource
	const openCreateDialog = useCallback(() => calendarRef.current?.openCreate(), [])

	useCreateAction(openCreateDialog)

	const initialTaskIds = useMemo(() => {
		const taskId = searchParams.get(TASK_PARAM)
		return taskId && planIdSchema.safeParse(taskId).success ? [taskId] : undefined
	}, [searchParams])

	return (
		<>
			<BrowserTitle title="Plans" />
			<TaskSourceAlert
				error={taskSource.error}
				loading={taskSource.isPending}
				onRetry={() => void taskSource.refetch()}
			/>
			{categorySource.error && (
				<Alert variant="destructive">
					<AlertDescription>
						Categories could not be loaded. Plans without a category remain available.{' '}
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
				<PlansCalendar
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
