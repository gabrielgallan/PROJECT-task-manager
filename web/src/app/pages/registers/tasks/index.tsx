import { format } from 'date-fns'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { TasksBoard } from '@/app/pages/registers/tasks/components/board/tasks-board'
import { DeleteTaskDialog } from '@/app/pages/registers/tasks/components/delete-task-dialog'
import { useTaskActivity } from '@/app/pages/registers/tasks/components/details/task-activity'
import { TaskDetailsSheet } from '@/app/pages/registers/tasks/components/details/task-details-sheet'
import { TasksGantt } from '@/app/pages/registers/tasks/components/gantt/tasks-gantt'
import { TasksList } from '@/app/pages/registers/tasks/components/list/tasks-list'
import { TaskDialog } from '@/app/pages/registers/tasks/components/task-dialog'
import { TasksToolbar } from '@/app/pages/registers/tasks/components/tasks-toolbar'
import { BrowserTitle } from '@/components/browser-title'
import { useTaskFilterDraft } from '@/features/tasks/hooks/use-task-filter-draft'
import { useTaskQuery } from '@/features/tasks/hooks/use-task-query'
import { applyTaskQuery, filterTasks, hasActiveTaskFilters } from '@/features/tasks/model/task-query'
import { TASK_STATUS_LABEL } from '@/features/tasks/model/task-status'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'
import { DEFAULT_TASK_VIEW, TASK_VIEW_VALUES } from '@/features/tasks/model/task-views'
import { useTasks } from '@/features/tasks/store/tasks-store'
import { useViewParam } from '@/hooks/use-view-param'
import { useCreateAction } from '@/hooks/use-create-action'

/** Marks which task the dialog is about; `null` means creating a new one. */
type TEditingTask = Task | null | undefined

export function TasksPage() {
	const [view, setView] = useViewParam(TASK_VIEW_VALUES, DEFAULT_TASK_VIEW)
	const navigate = useNavigate()

	const { tasks, changeTaskStatus, rescheduleTask, removeTask } = useTasks()
	const { query, applyFilters, toggleSort, setPage, clearFilters } = useTaskQuery()

	// The toolbar composes its filters here and only hands them to the query when
	// the search is submitted.
	const {
		draft,
		isDirty,
		canClear,
		setDraftSearch,
		toggleDraftStatus,
		toggleDraftPriority,
		clearDraftStatus,
		clearDraftPriority,
		apply,
		clearAll,
	} = useTaskFilterDraft({ query, onApply: applyFilters, onClear: clearFilters })

	const [editingTask, setEditingTask] = useState<TEditingTask>(undefined)
	const [deletingTask, setDeletingTask] = useState<Task | null>(null)
	const [detailedTask, setDetailedTask] = useState<Task | null>(null)
	const openCreateDialog = useCallback(() => setEditingTask(null), [])

	useCreateAction(openCreateDialog)

	const activity = useTaskActivity(detailedTask?.id)

	// Only the list pages the result. The timeline and the board draw every match
	// at once: scrolling through time, or down a column, is already their paging.
	const result = useMemo(() => applyTaskQuery(tasks, query), [tasks, query])
	const filteredTasks = useMemo(() => filterTasks(tasks, query), [tasks, query])

	const handleStatusChange = (task: Task, status: TaskStatus) => {
		changeTaskStatus(task.id, status)
		toast.success(`“${task.title}” moved to ${TASK_STATUS_LABEL[status]}`)
	}

	const handleReschedule = (task: Task, startDate: Date, dueDate: Date) => {
		rescheduleTask(task.id, startDate, dueDate)
		toast.success(`“${task.title}” rescheduled to ${format(dueDate, 'dd MMM')}`)
	}

	const handleDelete = (task: Task) => {
		removeTask(task.id)
		setDeletingTask(null)
		toast.success(`“${task.title}” deleted`)
	}

	// Planning and logging live on their own pages. The task id travels in the URL
	// so those pages can pick it up once they support being opened this way.
	const handlePlan = (task: Task) => {
		navigate(`/registers/plans?task=${task.id}`)
	}

	const handleLogWork = (task: Task) => {
		navigate(`/registers/work-logs?task=${task.id}`)
	}

	return (
		<>
			<BrowserTitle title="Tasks" />

			<div className="flex min-h-0 flex-1 flex-col">
				<div className="shrink-0 border-b px-4 py-3">
					<TasksToolbar
						draft={draft}
						isDirty={isDirty}
						canClear={canClear}
						view={view}
						onViewChange={setView}
						onSearchChange={setDraftSearch}
						onToggleStatus={toggleDraftStatus}
						onTogglePriority={toggleDraftPriority}
						onClearStatus={clearDraftStatus}
						onClearPriority={clearDraftPriority}
						onApply={apply}
						onClearAll={clearAll}
						onNewTask={openCreateDialog}
					/>
				</div>

				{view === 'timeline' && (
					<TasksGantt
						tasks={filteredTasks}
						isFiltered={hasActiveTaskFilters(query)}
						onReschedule={handleReschedule}
						onSelectTask={setEditingTask}
						onClearFilters={clearAll}
					/>
				)}

				{view === 'board' && (
					<TasksBoard
						tasks={filteredTasks}
						statusFilter={query.status}
						isFiltered={hasActiveTaskFilters(query)}
						onClearFilters={clearAll}
						onNewTask={openCreateDialog}
						onStatusChange={handleStatusChange}
						onDetails={setDetailedTask}
						onEdit={setEditingTask}
						onPlan={handlePlan}
						onLogWork={handleLogWork}
						onDelete={setDeletingTask}
					/>
				)}

				{view === 'list' && (
					<TasksList
						result={result}
						query={query}
						onSort={toggleSort}
						onPageChange={setPage}
						onClearFilters={clearAll}
						onNewTask={openCreateDialog}
						onStatusChange={handleStatusChange}
						onDetails={setDetailedTask}
						onEdit={setEditingTask}
						onPlan={handlePlan}
						onLogWork={handleLogWork}
						onDelete={setDeletingTask}
					/>
				)}
			</div>


			<TaskDetailsSheet
				task={detailedTask}
				entries={activity}
				onOpenChange={(open) => {
					if (!open) {
						setDetailedTask(null)
					}
				}}
				onOpenPlans={handlePlan}
				onOpenWorkLogs={handleLogWork}
			/>

			<TaskDialog
				task={editingTask ?? undefined}
				open={editingTask !== undefined}
				onOpenChange={(open) => {
					if (!open) {
						setEditingTask(undefined)
					}
				}}
			/>

			<DeleteTaskDialog
				task={deletingTask}
				onOpenChange={(open) => {
					if (!open) {
						setDeletingTask(null)
					}
				}}
				onConfirm={handleDelete}
			/>
		</>
	)
}
