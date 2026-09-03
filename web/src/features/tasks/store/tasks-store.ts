import { useTasksQuery } from '@/features/tasks/hooks/use-tasks-query'
import type { Task } from '@/features/tasks/model/task-types'

const EMPTY_TASKS: Task[] = []
export function useTasks() {
	const query = useTasksQuery({ sortBy: 'dueDate', sortDir: 'asc' })
	return { ...query, tasks: query.data?.tasks ?? EMPTY_TASKS }
}
