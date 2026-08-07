import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DeleteTaskDialog } from '@/app/pages/registers/tasks/components/delete-task-dialog'
import { TasksGantt } from '@/app/pages/registers/tasks/components/gantt/tasks-gantt'
import { TasksList } from '@/app/pages/registers/tasks/components/list/tasks-list'
import { TaskDialog } from '@/app/pages/registers/tasks/components/task-dialog'
import { TasksToolbar } from '@/app/pages/registers/tasks/components/tasks-toolbar'
import { BrowserTitle } from '@/components/browser-title'
import { useTaskQuery } from '@/features/tasks/hooks/use-task-query'
import {
	applyTaskQuery,
	countTasksBy,
	filterTasks,
	hasActiveTaskFilters,
} from '@/features/tasks/model/task-query'
import { TASK_STATUS_LABEL } from '@/features/tasks/model/task-status'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'
import { DEFAULT_TASK_VIEW, TASK_VIEW_VALUES } from '@/features/tasks/model/task-views'
import { useTasks } from '@/features/tasks/store/tasks-store'
import { useViewParam } from '@/hooks/use-view-param'

/** Marks which task the dialog is about; `null` means creating a new one. */
type TEditingTask = Task | null | undefined

export function TasksPage() {
	const [view] = useViewParam(TASK_VIEW_VALUES, DEFAULT_TASK_VIEW)
	const navigate = useNavigate()

	const { tasks, changeTaskStatus, rescheduleTask, removeTask } = useTasks()
	const {
		query,
		setSearch,
		toggleStatus,
		togglePriority,
		clearStatus,
		clearPriority,
		toggleSort,
		setPage,
		clearFilters,
	} = useTaskQuery()

	const [editingTask, setEditingTask] = useState<TEditingTask>(undefined)
	const [deletingTask, setDeletingTask] = useState<Task | null>(null)

	// The list pages the result; the timeline draws every match at once, since
	// scrolling through time is already its own form of paging.
	const result = useMemo(() => applyTaskQuery(tasks, query), [tasks, query])
	const timelineTasks = useMemo(() => filterTasks(tasks, query), [tasks, query])

	const statusCounts = useMemo(() => countTasksBy(tasks, query, 'status'), [tasks, query])
	const priorityCounts = useMemo(() => countTasksBy(tasks, query, 'priority'), [tasks, query])

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
						query={query}
						statusCounts={statusCounts}
						priorityCounts={priorityCounts}
						onSearchChange={setSearch}
						onToggleStatus={toggleStatus}
						onTogglePriority={togglePriority}
						onClearStatus={clearStatus}
						onClearPriority={clearPriority}
						onClearFilters={clearFilters}
						onNewTask={() => setEditingTask(null)}
					/>
				</div>

				{view === 'timeline' ? (
					<TasksGantt
						tasks={timelineTasks}
						isFiltered={hasActiveTaskFilters(query)}
						onReschedule={handleReschedule}
						onSelectTask={setEditingTask}
						onClearFilters={clearFilters}
					/>
				) : (
					<TasksList
						result={result}
						query={query}
						onSort={toggleSort}
						onPageChange={setPage}
						onClearFilters={clearFilters}
						onNewTask={() => setEditingTask(null)}
						onStatusChange={handleStatusChange}
						onEdit={setEditingTask}
						onPlan={handlePlan}
						onLogWork={handleLogWork}
						onDelete={setDeletingTask}
					/>
				)}
			</div>

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
