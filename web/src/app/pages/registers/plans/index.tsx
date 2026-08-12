import { parseISO } from 'date-fns'
import { useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { BrowserTitle } from '@/components/browser-title'
import { PlansCalendar, type PlansCalendarHandle } from '@/features/plans/calendar/plans-calendar'
import type { IPlan } from '@/features/plans/model/plan-types'
import { usePlans } from '@/features/plans/store/plans-store'
import { useTasks } from '@/features/tasks/store/tasks-store'
import { createWorkLog, validateRange } from '@/features/work-logs/model/work-log-rules'
import { useWorkLogs } from '@/features/work-logs/store/work-logs-store'
import { useCreateAction } from '@/hooks/use-create-action'

/** How the tasks page hands a task over when opening this one. */
const TASK_PARAM = 'task'

export function PlansPage() {
	const [searchParams] = useSearchParams()
	const calendarRef = useRef<PlansCalendarHandle>(null)
	const { plans, addPlan, updatePlan, removePlan } = usePlans()
	const { tasks } = useTasks()
	const { workLogs, addWorkLog } = useWorkLogs()
	const openCreateDialog = useCallback(() => calendarRef.current?.openCreate(), [])

	useCreateAction(openCreateDialog)

	// An unknown id would filter every plan out and read as an empty calendar,
	// so the link only takes effect for a task that is actually there.
	const initialTaskIds = useMemo(() => {
		const taskId = searchParams.get(TASK_PARAM)

		return taskId && tasks.some((task) => task.id === taskId) ? [taskId] : undefined
	}, [searchParams, tasks])

	/**
	 * The two modules are wired here, at the page, and only through plain fields:
	 * neither feature imports the other.
	 */
	const recordPlanAsWorkLog = (plan: IPlan) => {
		const range = {
			startDate: parseISO(plan.startDate),
			endDate: parseISO(plan.endDate),
		}
		const message = validateRange(workLogs, range)

		if (message) {
			toast.error(message)
			return false
		}

		addWorkLog(
			createWorkLog({
				title: plan.title,
				startDate: range.startDate,
				endDate: range.endDate,
				taskId: plan.taskId,
			}),
		)
		toast.success('Work log recorded')

		return true
	}

	return (
		<>
			<BrowserTitle title="Plans" />

			<div className="flex min-h-0 flex-1 flex-col">
				<PlansCalendar
					ref={calendarRef}
					plans={plans}
					tasks={tasks}
					initialTaskIds={initialTaskIds}
					onCreate={addPlan}
					onUpdate={updatePlan}
					onDelete={removePlan}
					onConfirmPlan={recordPlanAsWorkLog}
				/>
			</div>
		</>
	)
}
