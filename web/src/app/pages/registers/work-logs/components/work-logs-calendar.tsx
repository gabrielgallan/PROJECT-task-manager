import { Plus } from 'lucide-react'
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { WorkLogSummary } from '@/app/pages/registers/work-logs/components/work-log-day-summary'
import { WorkLogDialog } from '@/app/pages/registers/work-logs/components/work-log-dialog'
import {
	NO_TASK_FILTER,
	WorkLogFilter,
} from '@/app/pages/registers/work-logs/components/work-log-filter'
import {
	getWorkLogItemClassName,
	WorkLogItemContent,
} from '@/app/pages/registers/work-logs/components/work-log-item-content'
import { Button } from '@/components/ui/button'
import { CategoryFilter } from '@/features/categories/components/category-filter'
import type { TCategoryColor } from '@/features/categories/model/category-colors'
import {
	NO_CATEGORY_FILTER,
	resolveCategoryColor,
} from '@/features/categories/model/category-rules'
import type { ICategory } from '@/features/categories/model/category-types'
import { Calendar } from '@/features/calendar/calendar'
import type { ICalendarRange } from '@/features/calendar/types'
import type { Task } from '@/features/tasks/model/task-types'
import {
	DEFAULT_WORK_LOG_VIEW,
	WORK_LOG_STORAGE_KEY,
	WORK_LOG_VIEWS,
} from '@/features/work-logs/model/work-log-constants'
import {
	createWorkLog,
	getLogNowRange,
	getLogsForView,
	getUntrackedMinutes,
	sumMinutes,
	validateRange,
} from '@/features/work-logs/model/work-log-rules'
import type { TWorkLogFormData } from '@/features/work-logs/model/work-log-schema'
import type { IWorkLog, TWorkLogDialogState } from '@/features/work-logs/model/work-log-types'

interface IWorkLogsCalendarProps {
	workLogs: IWorkLog[]
	tasks: Task[]
	categories: ICategory[]
	uncategorizedColor: TCategoryColor
	/** Which task the page was opened for, so a link from the task carries over. */
	initialTaskIds?: string[]
	onCreate: (workLog: IWorkLog) => void
	onUpdate: (workLog: IWorkLog) => void
	onDelete: (workLog: IWorkLog) => void
}

export interface WorkLogsCalendarHandle {
	openCreate: () => void
}

export const WorkLogsCalendar = forwardRef<WorkLogsCalendarHandle, IWorkLogsCalendarProps>(
	function WorkLogsCalendar(
		{
			workLogs,
			tasks,
			categories,
			uncategorizedColor,
			initialTaskIds,
			onCreate,
			onUpdate,
			onDelete,
		},
		ref,
	) {
	const [dialog, setDialog] = useState<TWorkLogDialogState>({ mode: 'closed' })
	const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(initialTaskIds ?? [])
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

	const taskTitles = useMemo(() => new Map(tasks.map((task) => [task.id, task.title])), [tasks])
	const categoriesById = useMemo(
		() => new Map(categories.map((category) => [category.id, category])),
		[categories],
	)
	const getWorkLogColor = (workLog: IWorkLog) =>
		resolveCategoryColor(workLog.categoryId, categoriesById, uncategorizedColor)

	const visibleWorkLogs = useMemo(() => {
		return workLogs.filter((workLog) => {
			const matchesTask =
				selectedTaskIds.length === 0 ||
				selectedTaskIds.includes(workLog.taskId ?? NO_TASK_FILTER)
			const matchesCategory =
				selectedCategoryIds.length === 0 ||
				selectedCategoryIds.includes(workLog.categoryId ?? NO_CATEGORY_FILTER)

			return matchesTask && matchesCategory
		})
	}, [workLogs, selectedTaskIds, selectedCategoryIds])

	const closeDialog = () => setDialog({ mode: 'closed' })

	// Conflicts are always checked against every log, never the filtered subset.
	const validate = (range: ICalendarRange, ignoreId?: string) =>
		validateRange(workLogs, range, ignoreId)

	const openCreateDialog = (range: ICalendarRange) => {
		const message = validate(range)

		if (message) {
			toast.error(message)
			return
		}

		setDialog({ mode: 'create', range })
	}

	useImperativeHandle(ref, () => ({
		openCreate: () => openCreateDialog(getLogNowRange(workLogs)),
	}))

	const applyRangeChange = (workLog: IWorkLog, range: ICalendarRange) => {
		const message = validate(range, workLog.id)

		// Refusing leaves the item where it was: the state simply does not change.
		if (message) {
			toast.error(message)
			return
		}

		onUpdate({
			...workLog,
			startDate: range.startDate.toISOString(),
			endDate: range.endDate.toISOString(),
		})
	}

	const submitDialog = (values: TWorkLogFormData, current: IWorkLog | null) => {
		if (current) {
			onUpdate({
				...current,
				title: values.title,
				description: values.description?.trim() ? values.description : undefined,
				startDate: values.startDate.toISOString(),
				endDate: values.endDate.toISOString(),
				taskId: values.taskId ?? null,
				categoryId: values.categoryId ?? null,
			})
			toast.success('Work log updated')
		} else {
			onCreate(createWorkLog(values))
			toast.success('Work log created')
		}

		closeDialog()
	}

	const deleteWorkLog = (workLog: IWorkLog) => {
		onDelete(workLog)
		toast.success('Work log deleted')
		closeDialog()
	}

	const toggleTaskFilter = (taskId: string) =>
		setSelectedTaskIds((previous) =>
			previous.includes(taskId) ? previous.filter((id) => id !== taskId) : [...previous, taskId],
		)
	const toggleCategoryFilter = (categoryId: string) =>
		setSelectedCategoryIds((previous) =>
			previous.includes(categoryId)
				? previous.filter((id) => id !== categoryId)
				: [...previous, categoryId],
		)

	return (
		<Calendar
			items={visibleWorkLogs}
			defaultView={DEFAULT_WORK_LOG_VIEW}
			availableViews={WORK_LOG_VIEWS}
			storageKey={WORK_LOG_STORAGE_KEY}
			settings={{ weekends: true, timeFormat: true }}
			onCreate={openCreateDialog}
			onOpen={(workLog) => setDialog({ mode: 'edit', workLog })}
			onMove={applyRangeChange}
			onResize={applyRangeChange}
			renderItem={(workLog, context) => (
				<WorkLogItemContent
					workLog={workLog}
					color={getWorkLogColor(workLog)}
					context={context}
					taskTitle={workLog.taskId ? taskTitles.get(workLog.taskId) : undefined}
				/>
			)}
			getItemClassName={(workLog, context) =>
				getWorkLogItemClassName(getWorkLogColor(workLog), context)
			}
			getAgendaEmptyText={() => 'No work logged in this month.'}
			renderToolbarActions={({ selectedDate, view }) => {
				const logsInView = getLogsForView(visibleWorkLogs, selectedDate, view)

				return {
					beforeViews: (
						<div className="flex items-center gap-3">
							<WorkLogSummary
								loggedMinutes={sumMinutes(logsInView)}
								untrackedMinutes={view === 'day' ? getUntrackedMinutes(logsInView) : 0}
							/>

							<WorkLogFilter
								tasks={tasks}
								selectedTaskIds={selectedTaskIds}
								onToggle={toggleTaskFilter}
								onClear={() => setSelectedTaskIds([])}
							/>
							<CategoryFilter
								categories={categories}
								selectedCategoryIds={selectedCategoryIds}
								onToggle={toggleCategoryFilter}
								onClear={() => setSelectedCategoryIds([])}
								compactOnMobile
							/>
						</div>
					),
					afterSettings: (
						<Button size="sm" onClick={() => openCreateDialog(getLogNowRange(workLogs))}>
							<Plus />
							<span className="max-md:sr-only">Log now</span>
						</Button>
					),
				}
			}}
			renderOverlay={({ use24HourFormat }) => (
				<WorkLogDialog
					state={dialog}
					tasks={tasks}
					categories={categories}
					use24HourFormat={use24HourFormat}
					validateRange={validate}
					onClose={closeDialog}
					onSubmit={submitDialog}
					onDelete={deleteWorkLog}
				/>
			)}
		/>
	)
	},
)
