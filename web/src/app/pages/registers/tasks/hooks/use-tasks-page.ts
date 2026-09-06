import { format } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { useTaskDetailsQuery } from '@/features/tasks/hooks/use-task-details-query'
import { useTaskFilterDraft } from '@/features/tasks/hooks/use-task-filter-draft'
import { useEditTaskSchedule, useEditTaskStatus } from '@/features/tasks/hooks/use-task-mutations'
import { useTaskQuery } from '@/features/tasks/hooks/use-task-query'
import { useTasksQuery } from '@/features/tasks/hooks/use-tasks-query'
import { localToTaskDate } from '@/features/tasks/model/task-dates'
import { getTaskError, TaskActionBlockedError } from '@/features/tasks/model/task-errors'
import { hasActiveTaskFilters, TASKS_PAGE_SIZE } from '@/features/tasks/model/task-query'
import { taskStatusFormSchema } from '@/features/tasks/model/task-schema'
import { TASK_STATUS_LABEL } from '@/features/tasks/model/task-status'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'
import { DEFAULT_TASK_VIEW, TASK_VIEW_VALUES } from '@/features/tasks/model/task-views'
import { useCreateAction } from '@/hooks/use-create-action'
import { useViewParam } from '@/hooks/use-view-param'

type EditingTask = Task | null | undefined
export function useTasksPage(isMobile: boolean) {
	const [view, setView] = useViewParam(TASK_VIEW_VALUES, DEFAULT_TASK_VIEW)
	const navigate = useNavigate()
	const { query, applyFilters, toggleSort, setPage, clearFilters } = useTaskQuery()
	const filters = useMemo(
		() => ({
			search: query.search || undefined,
			status: query.status.length ? query.status : undefined,
			priority: query.priority.length ? query.priority : undefined,
		}),
		[query],
	)
	const list = useTasksQuery(
		{
			...filters,
			page: query.page,
			limit: TASKS_PAGE_SIZE,
			sortBy: isMobile ? 'dueDate' : query.sortBy,
			sortDir: isMobile ? 'asc' : query.sortDir,
		},
		view === 'list',
	)
	const collection = useTasksQuery(
		{ ...filters, sortBy: query.sortBy, sortDir: query.sortDir },
		view !== 'list',
	)
	const currentQuery = view === 'list' ? list : collection
	const tasks = currentQuery.data?.tasks ?? []
	const meta = list.data?.meta
	const pageCount = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1

	useEffect(() => {
		if (view === 'list' && meta && query.page > pageCount) setPage(pageCount)
	}, [view, meta, query.page, pageCount, setPage])

	const filterDraft = useTaskFilterDraft({ query, onApply: applyFilters, onClear: clearFilters })
	const [editingTask, setEditingTask] = useState<EditingTask>(undefined)
	const [deletingTask, setDeletingTask] = useState<Task | null>(null)
	const [detailedTask, setDetailedTask] = useState<Task | null>(null)
	const [actionError, setActionError] = useState<string | null>(null)
	const openCreateDialog = useCallback(() => setEditingTask(null), [])
	useCreateAction(openCreateDialog)
	const { capture } = useIdentityLifecycle()
	const statusMutation = useEditTaskStatus()
	const scheduleMutation = useEditTaskSchedule()
	const details = useTaskDetailsQuery(detailedTask?.id ?? '', !!detailedTask)

	async function changeStatus(task: Task, status: TaskStatus): Promise<void> {
		if (task.status === status) return
		const result = taskStatusFormSchema.safeParse({ status })
		if (!result.success) {
			setActionError(result.error.issues[0]?.message ?? 'Select a valid status')
			return
		}
		setActionError(null)
		const current = capture()
		try {
			await statusMutation.mutateAsync({ taskId: task.id, status: result.data.status })
			if (current()) {
				toast.success(`“${task.title}” moved to ${TASK_STATUS_LABEL[result.data.status]}`)
			}
		} catch (error) {
			if (current() && !(error instanceof TaskActionBlockedError)) {
				toast.error(getTaskError(error, 'status'))
			}
		}
	}
	async function reschedule(task: Task, startDate: Date, dueDate: Date) {
		const nextStart = localToTaskDate(startDate)
		const nextDue = localToTaskDate(dueDate)
		const currentStart = localToTaskDate(task.startDate)
		const currentDue = localToTaskDate(task.dueDate)
		const renderedStart = localToTaskDate(task.startDate ?? task.createdAt)
		const body = {
			...(nextStart !== currentStart && (task.startDate || nextStart !== renderedStart)
				? { startDate: nextStart }
				: {}),
			...(nextDue !== currentDue ? { dueDate: nextDue } : {}),
		}
		if (!Object.keys(body).length) return true
		setActionError(null)
		try {
			await scheduleMutation.mutateAsync({ taskId: task.id, ...body })
			toast.success(`“${task.title}” rescheduled to ${format(dueDate, 'dd MMM')}`)
			return true
		} catch (error) {
			if (!(error instanceof TaskActionBlockedError))
				setActionError(getTaskError(error, 'schedule'))
			return false
		}
	}
	const openPlan = (task: Task) => navigate(`/registers/plans?task=${task.id}`)
	const openWorkLog = (task: Task) => navigate(`/registers/work-logs?task=${task.id}`)
	return {
		view,
		setView,
		query,
		filters: filterDraft,
		list,
		collection,
		currentQuery,
		tasks,
		meta,
		result: { tasks, total: meta?.total ?? 0, page: meta?.page ?? query.page, pageCount },
		editingTask,
		setEditingTask,
		deletingTask,
		setDeletingTask,
		detailedTask,
		setDetailedTask,
		actionError,
		clearActionError: () => setActionError(null),
		details,
		openCreateDialog,
		changeStatus,
		reschedule,
		openPlan,
		openWorkLog,
		filtered: hasActiveTaskFilters(query),
		toggleSort,
		setPage,
	}
}
