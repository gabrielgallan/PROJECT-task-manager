import { TasksEmptyState } from '@/app/pages/registers/tasks/components/list/tasks-empty-state'
import { TasksTableRow } from '@/app/pages/registers/tasks/components/list/tasks-table-row'
import { TasksTableSortHead } from '@/app/pages/registers/tasks/components/list/tasks-table-sort-head'
import { Pagination } from '@/components/pagination'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	hasActiveTaskFilters,
	type ITaskQuery,
	type ITaskQueryResult,
	TASKS_PAGE_SIZE,
	type TTaskSortField,
} from '@/features/tasks/model/task-query'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'

const COLUMN_COUNT = 6

interface ITasksListProps {
	result: ITaskQueryResult
	query: ITaskQuery
	onSort: (field: TTaskSortField) => void
	onPageChange: (page: number) => void
	onClearFilters: () => void
	onNewTask: () => void
	onStatusChange: (task: Task, status: TaskStatus) => void
	onEdit: (task: Task) => void
	onPlan: (task: Task) => void
	onLogWork: (task: Task) => void
	onDelete: (task: Task) => void
}

export function TasksList({
	result,
	query,
	onSort,
	onPageChange,
	onClearFilters,
	onNewTask,
	...rowActions
}: ITasksListProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
			{/* The table body is what scrolls, so the header can stick and the
			    pagination stays reachable without scrolling to the bottom. */}
			<div className="border rounded-md overflow-hidden">
				<Table>
					<TableHeader className="sticky top-0 z-10 bg-muted">
						<TableRow>
							<TasksTableSortHead
								field="title"
								label="Title"
								query={query}
								onSort={onSort}
								className="w-66"
							/>

							<TasksTableSortHead
								field="status"
								label="Status"
								query={query}
								onSort={onSort}
								className="w-42"
							/>

							<TasksTableSortHead
								field="priority"
								label="Priority"
								query={query}
								onSort={onSort}
								className="w-42"
							/>

							<TasksTableSortHead
								field="updatedAt"
								label="Last modification"
								query={query}
								onSort={onSort}
								align="right"
							/>

							<TasksTableSortHead
								field="dueDate"
								label="Due date"
								query={query}
								onSort={onSort}
								align="right"
							/>

							<TableHead className="w-12" />
						</TableRow>
					</TableHeader>

					<TableBody>
						{result.tasks.length === 0 ? (
							<TableRow className="hover:bg-transparent">
								<TableCell colSpan={COLUMN_COUNT}>
									<TasksEmptyState
										filtered={hasActiveTaskFilters(query)}
										onClearFilters={onClearFilters}
										onNewTask={onNewTask}
									/>
								</TableCell>
							</TableRow>
						) : (
							result.tasks.map((task) => (
								<TasksTableRow key={task.id} task={task} {...rowActions} />
							))
						)}
					</TableBody>
				</Table>
			</div>

			<Pagination
				limit={TASKS_PAGE_SIZE}
				page={result.page}
				total={result.total}
				onPageChange={onPageChange}
			/>
		</div>
	)
}
