import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/features/calendar/calendar'
import { WORK_DAY_START_HOUR } from '@/features/calendar/constants'
import type { ICalendarRange } from '@/features/calendar/types'
import { PlanDialog } from '@/features/plans/calendar/plan-dialog'
import { getPlanItemClassName, PlanItemContent } from '@/features/plans/calendar/plan-item-content'
import { DEFAULT_PLAN_DURATION } from '@/features/plans/model/plan-constants'
import type { IPlan, TPlanDialogState } from '@/features/plans/model/plan-types'

interface IPlansCalendarProps {
	plans: IPlan[]
	/**
	 * Records the plan as work done elsewhere. Returns whether it was accepted,
	 * so the plan is only marked when the record was actually created.
	 */
	onConfirmPlan?: (plan: IPlan) => boolean
}

const PLAN_CALENDAR_VIEWS = ['day', 'week'] as const

export function PlansCalendar({ plans, onConfirmPlan }: IPlansCalendarProps) {
	const [allPlans, setAllPlans] = useState<IPlan[]>(plans)
	const [dialog, setDialog] = useState<TPlanDialogState>({ mode: 'closed' })

	const closeDialog = () => setDialog({ mode: 'closed' })
	const openCreateDialog = (range: ICalendarRange) => setDialog({ mode: 'create', range })
	const openEditDialog = (plan: IPlan) => setDialog({ mode: 'edit', plan })

	const createPlan = (plan: IPlan) => {
		setAllPlans((previous) => [...previous, plan])
		toast.success('Plan created')
		closeDialog()
	}

	const updatePlan = (plan: IPlan) => {
		setAllPlans((previous) => previous.map((item) => (item.id === plan.id ? plan : item)))
		toast.success('Plan updated')
		closeDialog()
	}

	const deletePlan = (plan: IPlan) => {
		setAllPlans((previous) => previous.filter((item) => item.id !== plan.id))
		toast.success('Plan deleted')
		closeDialog()
	}

	const confirmPlan = (plan: IPlan) => {
		if (!onConfirmPlan?.(plan)) return

		setAllPlans((previous) =>
			previous.map((item) =>
				item.id === plan.id ? { ...item, confirmedAt: new Date().toISOString() } : item,
			),
		)
		closeDialog()
	}

	const updatePlanRange = (plan: IPlan, range: ICalendarRange) => {
		setAllPlans((previous) =>
			previous.map((item) =>
				item.id === plan.id
					? {
							...item,
							startDate: range.startDate.toISOString(),
							endDate: range.endDate.toISOString(),
						}
					: item,
			),
		)
	}

	return (
		<Calendar
			items={allPlans}
			defaultView="week"
			availableViews={PLAN_CALENDAR_VIEWS}
			settings={{ weekends: true, timeFormat: true }}
			onCreate={openCreateDialog}
			onOpen={openEditDialog}
			onMove={updatePlanRange}
			onResize={updatePlanRange}
			renderItem={(plan, context) => <PlanItemContent plan={plan} context={context} />}
			getItemClassName={getPlanItemClassName}
			renderToolbarActions={({ selectedDate }) => ({
				afterSettings: (
					<Button
						size="sm"
						onClick={() => {
							const startDate = new Date(selectedDate)

							startDate.setHours(WORK_DAY_START_HOUR, 0, 0, 0)

							openCreateDialog({
								startDate,
								endDate: new Date(startDate.getTime() + DEFAULT_PLAN_DURATION * 60_000),
							})
						}}
					>
						<Plus />
						<span className="max-md:sr-only">New plan</span>
					</Button>
				),
			})}
			renderOverlay={({ use24HourFormat }) => (
				<PlanDialog
					state={dialog}
					use24HourFormat={use24HourFormat}
					onClose={closeDialog}
					onCreate={createPlan}
					onUpdate={updatePlan}
					onDelete={deletePlan}
					onConfirm={onConfirmPlan ? confirmPlan : undefined}
				/>
			)}
		/>
	)
}
