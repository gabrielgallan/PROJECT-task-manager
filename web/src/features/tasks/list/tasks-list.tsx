import { Pagination } from '@/components/pagination'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TasksTableHeader } from '@/features/tasks/list/tasks-table-header'
import { TasksTableRow } from '@/features/tasks/list/tasks-table-row'
import type { Task } from '@/features/tasks/model/task-types'

interface ITasksListProps {
	tasks: Task[]
}

export function TasksList({ tasks }: ITasksListProps) {
	return (
		<div className="styled-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
			<TasksTableHeader />

			<div className="rounded-md border overflow-hidden">
				<Table>
					<TableHeader className="bg-muted">
						<TableRow>
							<TableHead className="w-66">Title</TableHead>
							<TableHead className="w-42">Status</TableHead>
							<TableHead className="w-42">Priority</TableHead>
							<TableHead className="text-right">Last modification</TableHead>
							<TableHead className="text-right">Due date</TableHead>
							<TableHead className="text-right w-12" />
						</TableRow>
					</TableHeader>

					<TableBody>
						{tasks.map((task) => (
							<TasksTableRow key={task.id} task={task} />
						))}
					</TableBody>
				</Table>
			</div>

			<Pagination limit={10} page={1} total={tasks.length} onPageChange={() => {}} />
		</div>
	)
}
