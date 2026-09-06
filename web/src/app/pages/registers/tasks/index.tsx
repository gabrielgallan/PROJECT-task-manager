import { BrowserTitle } from '@/components/browser-title'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getTaskError } from '@/features/tasks/model/task-errors'
import { useIsMobile } from '@/hooks/use-mobile'
import { TasksBoard } from './components/board/tasks-board'
import { DeleteTaskDialog } from './components/delete-task-dialog'
import type { ITaskActivityEntry } from './components/details/task-activity'
import { TaskDetailsSheet } from './components/details/task-details-sheet'
import { TasksGantt } from './components/gantt/tasks-gantt'
import { TasksList } from './components/list/tasks-list'
import { TasksMobileList } from './components/list/tasks-mobile-list'
import { TaskDialog } from './components/task-dialog'
import { TasksToolbar } from './components/tasks-toolbar'
import { useTasksPage } from './hooks/use-tasks-page'

export function TasksPage() {
	const isMobile = useIsMobile()
	const page = useTasksPage(isMobile)

	const {
		view,
		setView,
		query,
		filters,
		currentQuery,
		tasks,
		result,
		editingTask,
		setEditingTask,
		deletingTask,
		setDeletingTask,
		detailedTask,
		setDetailedTask,
		actionError,
		clearActionError,
		details,
		openCreateDialog,
		changeStatus,
		reschedule,
		openPlan,
		openWorkLog,
		filtered,
		toggleSort,
		setPage,
	} = page

	const entries: ITaskActivityEntry[] = (details.data?.activity ?? []).map((entry) => ({
		...entry,
		startDate: new Date(entry.startsAt),
		endDate: new Date(entry.endsAt),
	}))

	const readError = currentQuery.error ? getTaskError(currentQuery.error, 'list') : null

	const detailsError = details.error ? getTaskError(details.error, 'details') : null

	const hasData = currentQuery.data !== undefined

	return (
		<>
			<BrowserTitle title="Tasks" />
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="shrink-0 border-b px-4 py-3">
					<TasksToolbar
						draft={filters.draft}
						isDirty={filters.isDirty}
						canClear={filters.canClear}
						view={view}
						onViewChange={setView}
						onSearchChange={filters.setDraftSearch}
						onToggleStatus={filters.toggleDraftStatus}
						onTogglePriority={filters.toggleDraftPriority}
						onClearStatus={filters.clearDraftStatus}
						onClearPriority={filters.clearDraftPriority}
						onApply={filters.apply}
						onClearAll={filters.clearAll}
						onNewTask={openCreateDialog}
					/>
				</div>
				{(actionError || readError) && (
					<div className="px-4 pt-4">
						<Alert variant="destructive">
							<AlertDescription>{actionError ?? readError}</AlertDescription>
						</Alert>
						<div className="mt-2 flex gap-2">
							{readError && (
								<Button size="sm" variant="outline" onClick={() => void currentQuery.refetch()}>
									Try again
								</Button>
							)}
							{actionError && (
								<Button size="sm" variant="outline" onClick={clearActionError}>
									Dismiss
								</Button>
							)}
						</div>
					</div>
				)}
				{currentQuery.isPending && (
					<p role="status" className="m-auto text-sm text-muted-foreground">
						Loading tasks…
					</p>
				)}
				{hasData && view === 'timeline' && (
					<TasksGantt
						tasks={tasks}
						isFiltered={filtered}
						onReschedule={reschedule}
						onSelectTask={setEditingTask}
						onClearFilters={filters.clearAll}
					/>
				)}
				{hasData && view === 'board' && (
					<TasksBoard
						tasks={tasks}
						statusFilter={query.status}
						isFiltered={filtered}
						onClearFilters={filters.clearAll}
						onNewTask={openCreateDialog}
						onStatusChange={(task, status) => void changeStatus(task, status)}
						onDetails={setDetailedTask}
						onEdit={setEditingTask}
						onPlan={openPlan}
						onLogWork={openWorkLog}
						onDelete={setDeletingTask}
					/>
				)}

				{hasData && view === 'list' && isMobile && (
					<TasksMobileList
						result={result}
						filtered={filtered}
						onPageChange={setPage}
						onClearFilters={filters.clearAll}
						onNewTask={openCreateDialog}
						onStatusChange={changeStatus}
						onDetails={setDetailedTask}
						onEdit={setEditingTask}
						onDelete={setDeletingTask}
					/>
				)}

				{hasData && view === 'list' && !isMobile && (
					<TasksList
						result={result}
						query={query}
						onSort={toggleSort}
						onPageChange={setPage}
						onClearFilters={filters.clearAll}
						onNewTask={openCreateDialog}
						onStatusChange={(task, status) => void changeStatus(task, status)}
						onDetails={setDetailedTask}
						onEdit={setEditingTask}
						onPlan={openPlan}
						onLogWork={openWorkLog}
						onDelete={setDeletingTask}
					/>
				)}
			</div>
			<TaskDetailsSheet
				task={details.data?.task ?? detailedTask}
				entries={entries}
				summary={details.data?.summary}
				loading={details.isPending && !!detailedTask}
				error={detailsError}
				onRetry={() => void details.refetch()}
				onOpenChange={(open) => !open && setDetailedTask(null)}
				onOpenPlans={openPlan}
				onOpenWorkLogs={openWorkLog}
			/>
			<TaskDialog
				task={editingTask ?? undefined}
				open={editingTask !== undefined}
				onOpenChange={(open) => !open && setEditingTask(undefined)}
			/>
			<DeleteTaskDialog
				task={deletingTask}
				onOpenChange={(open) => !open && setDeletingTask(null)}
				onDeleted={(task) => {
					if (detailedTask?.id === task.id) setDetailedTask(null)
				}}
			/>
		</>
	)
}
