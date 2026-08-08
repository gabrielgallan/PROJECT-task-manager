import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/features/calendar/calendar'
import { WORK_DAY_START_HOUR } from '@/features/calendar/constants'
import type { ICalendarRange } from '@/features/calendar/types'
import { PlanDialog } from '@/features/plans/calendar/plan-dialog'
import { NO_TASK_FILTER, PlanFilter } from '@/features/plans/calendar/plan-filter'
import { getPlanItemClassName, PlanItemContent } from '@/features/plans/calendar/plan-item-content'
import {
	DEFAULT_PLAN_DURATION,
	DEFAULT_PLAN_VIEW,
	PLAN_STORAGE_KEY,
	PLAN_VIEWS,
} from '@/features/plans/model/plan-constants'
import type { IPlan, TPlanDialogState } from '@/features/plans/model/plan-types'
import type { Task } from '@/features/tasks/model/task-types'

interface IPlansCalendarProps {
	plans: IPlan[]
	tasks: Task[]
	/** Which task the page was opened for, so a link from the task carries over. */
	initialTaskIds?: string[]
	onCreate: (plan: IPlan) => void
	onUpdate: (plan: IPlan) => void
	onDelete: (plan: IPlan) => void
	/**
	 * Records the plan as work done elsewhere. Returns whether it was accepted,
	 * so the plan is only marked when the record was actually created.
	 */
	onConfirmPlan?: (plan: IPlan) => boolean
}

export function PlansCalendar({
	plans,
	tasks,
	initialTaskIds,
	onCreate,
	onUpdate,
	onDelete,
	onConfirmPlan,
}: IPlansCalendarProps) {
	const [dialog, setDialog] = useState<TPlanDialogState>({ mode: 'closed' })
	const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(initialTaskIds ?? [])

	const taskTitles = useMemo(() => new Map(tasks.map((task) => [task.id, task.title])), [tasks])

	const visiblePlans = useMemo(() => {
		if (selectedTaskIds.length === 0) {
			return plans
		}

		return plans.filter((plan) => selectedTaskIds.includes(plan.taskId ?? NO_TASK_FILTER))
	}, [plans, selectedTaskIds])

	const closeDialog = () => setDialog({ mode: 'closed' })
	const openCreateDialog = (range: ICalendarRange) => setDialog({ mode: 'create', range })

	const createPlan = (plan: IPlan) => {
		onCreate(plan)
		toast.success('Plan created')
		closeDialog()
	}

	const updatePlan = (plan: IPlan) => {
		onUpdate(plan)
		toast.success('Plan updated')
		closeDialog()
	}

	const deletePlan = (plan: IPlan) => {
		onDelete(plan)
		toast.success('Plan deleted')
		closeDialog()
	}

	const confirmPlan = (plan: IPlan) => {
		if (!onConfirmPlan?.(plan)) return

		onUpdate({ ...plan, confirmedAt: new Date().toISOString() })
		closeDialog()
	}

	// Dragging only moves the plan in time, so it goes straight through.
	const updatePlanRange = (plan: IPlan, range: ICalendarRange) =>
		onUpdate({
			...plan,
			startDate: range.startDate.toISOString(),
			endDate: range.endDate.toISOString(),
		})

	const toggleTaskFilter = (taskId: string) =>
		setSelectedTaskIds((previous) =>
			previous.includes(taskId) ? previous.filter((id) => id !== taskId) : [...previous, taskId],
		)

	return (
		<Calendar
			items={visiblePlans}
			defaultView={DEFAULT_PLAN_VIEW}
			availableViews={PLAN_VIEWS}
			storageKey={PLAN_STORAGE_KEY}
			settings={{ weekends: true, timeFormat: true }}
			onCreate={openCreateDialog}
			onOpen={(plan) => setDialog({ mode: 'edit', plan })}
			onMove={updatePlanRange}
			onResize={updatePlanRange}
			renderItem={(plan, context) => (
				<PlanItemContent
					plan={plan}
					context={context}
					taskTitle={plan.taskId ? taskTitles.get(plan.taskId) : undefined}
				/>
			)}
			getItemClassName={getPlanItemClassName}
			renderToolbarActions={({ selectedDate }) => ({
				beforeViews: (
					<PlanFilter
						tasks={tasks}
						selectedTaskIds={selectedTaskIds}
						onToggle={toggleTaskFilter}
						onClear={() => setSelectedTaskIds([])}
					/>
				),
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
					tasks={tasks}
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
