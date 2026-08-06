import { parseISO } from 'date-fns'
import { toast } from 'sonner'
import { BrowserTitle } from '@/components/browser-title'
import { PlansCalendar } from '@/features/plans/calendar/plans-calendar'
import { PLANS_MOCK } from '@/features/plans/mocks/plans'
import type { IPlan } from '@/features/plans/model/plan-types'
import { createWorkLog, validateRange } from '@/features/work-logs/model/work-log-rules'
import { useWorkLogs } from '@/features/work-logs/store/work-logs-store'

export function PlansPage() {
	const { workLogs, addWorkLog } = useWorkLogs()

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
				<PlansCalendar plans={PLANS_MOCK} onConfirmPlan={recordPlanAsWorkLog} />
			</div>
		</>
	)
}
