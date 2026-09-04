import { Temporal } from '@js-temporal/polyfill'
import { Plus } from 'lucide-react'
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/features/calendar/calendar'
import { SLOT_MINUTES, WORK_DAY_START_HOUR } from '@/features/calendar/constants'
import {
	calendarDateToInstant,
	calendarDayStartToInstant,
	InvalidCalendarTimeError,
	instantToCalendarDate,
	instantToCalendarText,
	useTimeZone,
} from '@/features/calendar/lib/time-zone'
import type { ICalendarRange, ICalendarVisibleRange } from '@/features/calendar/types'
import { CategoryFilter } from '@/features/categories/components/category-filter'
import { CATEGORY_COLORS, type TCategoryColor } from '@/features/categories/model/category-colors'
import { NO_CATEGORY_FILTER } from '@/features/categories/model/category-rules'
import type { ICategory } from '@/features/categories/model/category-types'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { useEditPlanSchedule } from '@/features/plans/hooks/use-plan-mutations'
import { usePlanPendingIds } from '@/features/plans/hooks/use-plan-pending'
import { usePlansQuery } from '@/features/plans/hooks/use-plans-query'
import {
	DEFAULT_PLAN_DURATION,
	DEFAULT_PLAN_VIEW,
	PLAN_STORAGE_KEY,
	PLAN_VIEWS,
} from '@/features/plans/model/plan-constants'
import { getPlanError, PlanActionBlockedError } from '@/features/plans/model/plan-errors'
import type { PlanCalendarItem, TPlanDialogState } from '@/features/plans/model/plan-types'
import type { Task } from '@/features/tasks/model/task-types'
import { PlanDialog } from './plan-dialog'
import { NO_TASK_FILTER, PlanFilter } from './plan-filter'
import { getPlanItemClassName, PlanItemContent } from './plan-item-content'

interface Props {
	tasks: Task[]
	categories: ICategory[]
	uncategorizedColor: TCategoryColor
	initialTaskIds?: string[]
}
export interface PlansCalendarHandle {
	openCreate: () => void
}

function commandRange(timeZone: string): ICalendarRange {
	const startDate = instantToCalendarDate(new Date().toISOString(), timeZone)
	startDate.setSeconds(0, 0)
	startDate.setMinutes(Math.ceil(startDate.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES)
	return { startDate, endDate: new Date(startDate.getTime() + DEFAULT_PLAN_DURATION * 60_000) }
}

export const PlansCalendar = forwardRef<PlansCalendarHandle, Props>(function PlansCalendar(
	{ tasks, categories, uncategorizedColor, initialTaskIds },
	ref,
) {
	const [timeZone] = useTimeZone()
	const [dialog, setDialog] = useState<TPlanDialogState>({ mode: 'closed' })
	const [visibleRange, setVisibleRange] = useState<ICalendarVisibleRange | null>(null)
	const [selectedTaskIds, setSelectedTaskIds] = useState(initialTaskIds ?? [])
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
	const [scheduleError, setScheduleError] = useState<string | null>(null)
	const [previews, setPreviews] = useState(() => new Map<string, PlanCalendarItem>())
	const { capture, generation } = useIdentityLifecycle()
	const seenGeneration = useRef(generation)
	const schedule = useEditPlanSchedule()
	const isPlanPending = usePlanPendingIds()
	const getNow = useCallback(
		() => instantToCalendarDate(new Date().toISOString(), timeZone),
		[timeZone],
	)
	useEffect(() => {
		if (seenGeneration.current === generation) return
		seenGeneration.current = generation
		setPreviews(new Map())
		setScheduleError(null)
		setDialog({ mode: 'closed' })
		setSelectedTaskIds([])
		setSelectedCategoryIds([])
	}, [generation])
	const request = useMemo(
		() => ({
			from: visibleRange
				? calendarDayStartToInstant(visibleRange.startDate, timeZone)
				: new Date(0).toISOString(),
			to: visibleRange
				? calendarDayStartToInstant(visibleRange.endDate, timeZone)
				: new Date(1).toISOString(),
			taskId: selectedTaskIds.filter((id) => id !== NO_TASK_FILTER),
			categoryId: selectedCategoryIds.filter((id) => id !== NO_CATEGORY_FILTER),
			...(selectedTaskIds.includes(NO_TASK_FILTER) ? { withoutTask: true as const } : {}),
			...(selectedCategoryIds.includes(NO_CATEGORY_FILTER)
				? { withoutCategory: true as const }
				: {}),
		}),
		[selectedCategoryIds, selectedTaskIds, timeZone, visibleRange],
	)
	const query = usePlansQuery(request, timeZone, !!visibleRange)
	const plans = useMemo(
		() => (query.data ?? []).map((item) => previews.get(item.id) ?? item),
		[previews, query.data],
	)
	const itemsRange = visibleRange
		? { startDate: visibleRange.startDate, endDate: visibleRange.endDate }
		: null

	const publishRange = useCallback(
		(range: ICalendarVisibleRange) =>
			setVisibleRange((current) =>
				current?.view === range.view &&
				current.startDate.getTime() === range.startDate.getTime() &&
				current.endDate.getTime() === range.endDate.getTime()
					? current
					: range,
			),
		[],
	)
	const closeDialog = () => setDialog({ mode: 'closed' })
	const openCreate = (range: ICalendarRange) => setDialog({ mode: 'create', range })
	useImperativeHandle(ref, () => ({ openCreate: () => openCreate(commandRange(timeZone)) }), [
		timeZone,
	])

	function colorFor(item: PlanCalendarItem): TCategoryColor {
		const color = item.plan.category?.color
		return color && CATEGORY_COLORS.some((known) => known === color)
			? (color as TCategoryColor)
			: uncategorizedColor
	}

	async function reschedule(
		item: PlanCalendarItem,
		range: ICalendarRange,
		kind: 'move' | 'resize',
	) {
		const current = capture()
		setScheduleError(null)
		try {
			let startsAt = item.plan.startsAt
			let endsAt = item.plan.endsAt
			if (kind === 'move') {
				startsAt = calendarDateToInstant(range.startDate, timeZone).iso
				const duration = Date.parse(item.plan.endsAt) - Date.parse(item.plan.startsAt)
				endsAt = Temporal.Instant.from(startsAt).add({ milliseconds: duration }).toString()
			} else {
				const oldStart = instantToCalendarDate(item.plan.startsAt, timeZone)
				const oldEnd = instantToCalendarDate(item.plan.endsAt, timeZone)
				if (oldStart.getTime() !== range.startDate.getTime())
					startsAt = calendarDateToInstant(range.startDate, timeZone).iso
				if (oldEnd.getTime() !== range.endDate.getTime())
					endsAt = calendarDateToInstant(range.endDate, timeZone).iso
			}
			if (startsAt === item.plan.startsAt && endsAt === item.plan.endsAt) return
			if (Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error('invalid range')
			const nextPreview = {
				...item,
				startDate: instantToCalendarText(startsAt, timeZone),
				endDate: instantToCalendarText(endsAt, timeZone),
				plan: { ...item.plan, startsAt, endsAt },
			}
			setPreviews((current) => new Map(current).set(item.id, nextPreview))
			await schedule.mutateAsync({
				planId: item.id,
				...(startsAt !== item.plan.startsAt ? { startsAt } : {}),
				...(endsAt !== item.plan.endsAt ? { endsAt } : {}),
			})
		} catch (error) {
			if (!current()) return
			if (error instanceof InvalidCalendarTimeError)
				setScheduleError('This time does not exist in the selected timezone.')
			else if (error instanceof Error && error.message === 'invalid range')
				setScheduleError('End must be after start.')
			else if (!(error instanceof PlanActionBlockedError))
				setScheduleError(getPlanError(error, 'schedule'))
		} finally {
			if (current())
				setPreviews((values) => {
					const next = new Map(values)
					next.delete(item.id)
					return next
				})
		}
	}

	return (
		<>
			{query.isPending && (
				<p role="status" className="px-4 py-2 text-sm text-muted-foreground">
					Loading plans…
				</p>
			)}
			{query.isFetching && !query.isPending && (
				<p role="status" className="px-4 py-1 text-xs text-muted-foreground">
					Refreshing plans…
				</p>
			)}
			{query.error && (
				<Alert variant="destructive" className="mb-2">
					<AlertDescription>
						{getPlanError(query.error, 'list')}{' '}
						<Button type="button" variant="link" onClick={() => void query.refetch()}>
							Try again
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{scheduleError && (
				<Alert variant="destructive" className="mb-2">
					<AlertDescription>{scheduleError}</AlertDescription>
				</Alert>
			)}
			<Calendar
				items={plans}
				getNow={getNow}
				itemsRange={itemsRange}
				onVisibleRangeChange={publishRange}
				defaultView={DEFAULT_PLAN_VIEW}
				availableViews={PLAN_VIEWS}
				storageKey={PLAN_STORAGE_KEY}
				settings={{ weekends: true, timeFormat: true }}
				onCreate={openCreate}
				onOpen={(item) => setDialog({ mode: 'edit', plan: item })}
				onMove={(item, range) => void reschedule(item, range, 'move')}
				onResize={(item, range) => void reschedule(item, range, 'resize')}
				renderItem={(item, context) => (
					<PlanItemContent
						plan={item.plan}
						color={colorFor(item)}
						context={context}
						taskTitle={item.plan.task?.title}
					/>
				)}
				getItemClassName={(item, context) => getPlanItemClassName(colorFor(item), context)}
				isItemDisabled={(item) => isPlanPending(item.id)}
				renderToolbarActions={({ selectedDate }) => ({
					beforeViews: (
						<div className="flex items-center gap-2">
							<PlanFilter
								tasks={tasks}
								selectedTaskIds={selectedTaskIds}
								onToggle={(id) =>
									setSelectedTaskIds((values) =>
										values.includes(id) ? values.filter((value) => value !== id) : [...values, id],
									)
								}
								onClear={() => setSelectedTaskIds([])}
							/>
							<CategoryFilter
								categories={categories}
								selectedCategoryIds={selectedCategoryIds}
								onToggle={(id) =>
									setSelectedCategoryIds((values) =>
										values.includes(id) ? values.filter((value) => value !== id) : [...values, id],
									)
								}
								onClear={() => setSelectedCategoryIds([])}
								compactOnMobile
							/>
						</div>
					),
					afterSettings: (
						<Button
							size="sm"
							onClick={() => {
								const startDate = new Date(selectedDate)
								startDate.setHours(WORK_DAY_START_HOUR, 0, 0, 0)
								openCreate({
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
						key={dialog.mode === 'edit' ? `edit:${dialog.plan.id}` : dialog.mode}
						state={dialog}
						tasks={tasks}
						categories={categories}
						timeZone={timeZone}
						use24HourFormat={use24HourFormat}
						onClose={closeDialog}
					/>
				)}
			/>
			{query.isSuccess && plans.length === 0 && (
				<p className="px-4 py-2 text-sm text-muted-foreground">No plans in this range.</p>
			)}
		</>
	)
})
