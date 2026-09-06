import { Temporal } from '@js-temporal/polyfill'
import { Loader2, Plus } from 'lucide-react'
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
import {
	calendarDateToInstant,
	calendarDayStartToInstant,
	calendarRangeToIso,
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
import type { Task } from '@/features/tasks/model/task-types'
import { useLogNow } from '@/features/work-logs/hooks/use-log-now'
import { useEditWorkLogSchedule } from '@/features/work-logs/hooks/use-work-log-mutations'
import { useWorkLogPendingIds } from '@/features/work-logs/hooks/use-work-log-pending'
import { useWorkLogsQuery } from '@/features/work-logs/hooks/use-work-logs-query'
import {
	DEFAULT_WORK_LOG_VIEW,
	WORK_LOG_STORAGE_KEY,
	WORK_LOG_VIEWS,
} from '@/features/work-logs/model/work-log-constants'
import {
	getWorkLogError,
	WorkLogActionBlockedError,
} from '@/features/work-logs/model/work-log-errors'
import {
	getUntrackedMinutes,
	sumMinutes,
	validateWorkLogInterval,
} from '@/features/work-logs/model/work-log-rules'
import type {
	TWorkLogDialogState,
	WorkLogCalendarItem,
} from '@/features/work-logs/model/work-log-types'
import { useIsMobile } from '@/hooks/use-mobile'
import { WorkLogSummary } from './work-log-day-summary'
import { WorkLogDialog } from './work-log-dialog'
import { NO_TASK_FILTER, WorkLogFilter } from './work-log-filter'
import { getWorkLogItemClassName, WorkLogItemContent } from './work-log-item-content'

interface Props {
	tasks: Task[]
	categories: ICategory[]
	uncategorizedColor: TCategoryColor
	initialTaskIds?: string[]
}

export interface WorkLogsCalendarHandle {
	openCreate: () => void
}

export const WorkLogsCalendar = forwardRef<WorkLogsCalendarHandle, Props>(function WorkLogsCalendar(
	{ tasks, categories, uncategorizedColor, initialTaskIds },
	ref,
) {
	const [timeZone] = useTimeZone()
	const [dialog, setDialog] = useState<TWorkLogDialogState>({ mode: 'closed' })
	const [visibleRange, setVisibleRange] = useState<ICalendarVisibleRange | null>(null)
	const [selectedTaskIds, setSelectedTaskIds] = useState(initialTaskIds ?? [])
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
	const [scheduleError, setScheduleError] = useState<string | null>(null)
	const [previews, setPreviews] = useState(() => new Map<string, WorkLogCalendarItem>())
	const { capture, generation } = useIdentityLifecycle()
	const seenGeneration = useRef(generation)
	const schedule = useEditWorkLogSchedule()
	const isWorkLogPending = useWorkLogPendingIds()
	const logNow = useLogNow(timeZone)
	const getNow = useCallback(
		() => instantToCalendarDate(new Date().toISOString(), timeZone),
		[timeZone],
	)

	const isMobile = useIsMobile()

	useEffect(() => {
		if (seenGeneration.current === generation) return
		seenGeneration.current = generation
		setPreviews(new Map())
		setScheduleError(null)
		setDialog({ mode: 'closed' })
		setSelectedTaskIds([])
		setSelectedCategoryIds([])
	}, [generation])

	useEffect(() => {
		setPreviews(new Map())
		setScheduleError(null)
	}, [timeZone])

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
	const query = useWorkLogsQuery(request, timeZone, !!visibleRange)
	const items = useMemo(
		() => (query.data ?? []).map((item) => previews.get(item.id) ?? item),
		[previews, query.data],
	)
	const workLogs = useMemo(() => (query.data ?? []).map((item) => item.workLog), [query.data])
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

	function colorFor(item: WorkLogCalendarItem): TCategoryColor {
		const color = item.workLog.category?.color
		return color && CATEGORY_COLORS.some((known) => known === color)
			? (color as TCategoryColor)
			: uncategorizedColor
	}

	function openCreate(range: ICalendarRange) {
		setScheduleError(null)
		logNow.clearError()
		try {
			const instantRange = calendarRangeToIso(range, timeZone)
			const error = validateWorkLogInterval(
				workLogs,
				instantRange.startsAt,
				instantRange.endsAt,
				timeZone,
			)
			if (error) {
				setScheduleError(error)
				return
			}
			setDialog({
				mode: 'create',
				range,
				original: { startsAt: instantRange.startsAt, endsAt: instantRange.endsAt },
			})
		} catch (error) {
			setScheduleError(
				error instanceof InvalidCalendarTimeError ? error.message : 'End must be after start.',
			)
		}
	}

	async function openLogNow() {
		setScheduleError(null)
		const draft = await logNow.getRange()
		if (draft) setDialog({ mode: 'create', ...draft })
	}

	useImperativeHandle(ref, () => ({ openCreate: () => void openLogNow() }), [openLogNow])

	async function reschedule(
		item: WorkLogCalendarItem,
		range: ICalendarRange,
		kind: 'move' | 'resize',
	) {
		const current = capture()
		setScheduleError(null)
		logNow.clearError()
		try {
			let startsAt = item.workLog.startsAt
			let endsAt = item.workLog.endsAt
			if (kind === 'move') {
				startsAt = calendarDateToInstant(range.startDate, timeZone).iso
				const duration = Date.parse(item.workLog.endsAt) - Date.parse(item.workLog.startsAt)
				endsAt = Temporal.Instant.from(startsAt).add({ milliseconds: duration }).toString()
			} else {
				const oldStart = instantToCalendarDate(item.workLog.startsAt, timeZone)
				const oldEnd = instantToCalendarDate(item.workLog.endsAt, timeZone)
				if (oldStart.getTime() !== range.startDate.getTime())
					startsAt = calendarDateToInstant(range.startDate, timeZone, {
						original: item.workLog.startsAt,
					}).iso
				if (oldEnd.getTime() !== range.endDate.getTime())
					endsAt = calendarDateToInstant(range.endDate, timeZone, {
						original: item.workLog.endsAt,
					}).iso
			}
			if (startsAt === item.workLog.startsAt && endsAt === item.workLog.endsAt) return
			const error = validateWorkLogInterval(workLogs, startsAt, endsAt, timeZone, item.id)
			if (error) {
				setScheduleError(error)
				return
			}
			setPreviews((values) =>
				new Map(values).set(item.id, {
					...item,
					startDate: instantToCalendarText(startsAt, timeZone),
					endDate: instantToCalendarText(endsAt, timeZone),
					workLog: { ...item.workLog, startsAt, endsAt },
				}),
			)
			await schedule.mutateAsync({
				workLogId: item.id,
				timeZone,
				...(startsAt !== item.workLog.startsAt ? { startsAt } : {}),
				...(endsAt !== item.workLog.endsAt ? { endsAt } : {}),
			})
		} catch (error) {
			if (!current()) return
			if (error instanceof InvalidCalendarTimeError) setScheduleError(error.message)
			else if (error instanceof WorkLogActionBlockedError) return
			else setScheduleError(getWorkLogError(error, 'schedule'))
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
			{query.isPending && visibleRange && (
				<p role="status" className="px-4 py-2 text-sm text-muted-foreground">
					Loading work logs…
				</p>
			)}
			{query.isFetching && !query.isPending && (
				<p role="status" className="px-4 py-1 text-xs text-muted-foreground">
					Refreshing work logs…
				</p>
			)}
			{query.error && (
				<Alert variant="destructive" className="mb-2">
					<AlertDescription>
						{getWorkLogError(query.error, 'list')}{' '}
						<Button type="button" variant="link" onClick={() => void query.refetch()}>
							Try again
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{(scheduleError || logNow.error) && (
				<Alert variant="destructive" className="mb-2">
					<AlertDescription>
						{scheduleError ?? logNow.error}{' '}
						{logNow.error && (
							<Button type="button" variant="link" onClick={() => void openLogNow()}>
								Try again
							</Button>
						)}
					</AlertDescription>
				</Alert>
			)}

			<Calendar
				items={items}
				getNow={getNow}
				itemsRange={itemsRange}
				onVisibleRangeChange={publishRange}
				defaultView={DEFAULT_WORK_LOG_VIEW}
				availableViews={WORK_LOG_VIEWS}
				storageKey={WORK_LOG_STORAGE_KEY}
				settings={{ weekends: true, timeFormat: true }}
				onCreate={openCreate}
				onOpen={(item) => setDialog({ mode: 'edit', item })}
				onMove={(item, range) => void reschedule(item, range, 'move')}
				onResize={(item, range) => void reschedule(item, range, 'resize')}
				renderItem={(item, context) => (
					<WorkLogItemContent workLog={item.workLog} color={colorFor(item)} context={context} />
				)}
				getItemClassName={(item, context) => getWorkLogItemClassName(colorFor(item), context)}
				isItemDisabled={(item) => isWorkLogPending(item.id)}
				renderToolbarActions={({ view }) => ({
					beforeViews: (
						<WorkLogSummary
							loggedMinutes={sumMinutes(workLogs)}
							untrackedMinutes={view === 'day' ? getUntrackedMinutes(workLogs) : 0}
						/>
					),
					filters: (
						<div className="flex items-center gap-2">
							<WorkLogFilter
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
							size={isMobile ? 'icon' : 'sm'}
							disabled={logNow.pending}
							onClick={() => void openLogNow()}
						>
							<Plus />
							<span className="max-md:sr-only">
								{logNow.pending ? <Loader2 className="animate-spin" /> : 'Log now'}
							</span>
						</Button>
					),
				})}
				renderOverlay={({ use24HourFormat }) => (
					<WorkLogDialog
						key={dialog.mode === 'edit' ? `edit:${dialog.item.id}` : dialog.mode}
						state={dialog}
						categories={categories}
						knownWorkLogs={workLogs}
						timeZone={timeZone}
						use24HourFormat={use24HourFormat}
						onClose={() => setDialog({ mode: 'closed' })}
					/>
				)}
			/>

			{query.isSuccess && items.length === 0 && (
				<p className="px-4 py-2 text-sm text-muted-foreground">
					No work logs in this range. Select a past time in the calendar to add one.
				</p>
			)}
		</>
	)
})
