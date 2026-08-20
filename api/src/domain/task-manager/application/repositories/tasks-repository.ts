import { PaginatedList, PaginationInput } from '@/core/types/pagination'
import type { Task, TaskPriority, TaskStatus } from '../../enterprise/entities/task'

export type TaskFilterInput = {
	search?: string
	status?: TaskStatus[]
	priority?: TaskPriority[]
}

export type TaskSortByOptions = 'title' | 'status' | 'priority' | 'updatedAt' | 'dueDate'

export type TaskSortInput = {
	by: TaskSortByOptions
	dir: 'asc' | 'desc'
}

export type TaskOptionsCursor = {
	title: string
	id: string
}
export abstract class TasksRepository {
	abstract create(task: Task): Promise<void>
	abstract findById(taskId: string): Promise<Task | null>
	abstract listByUserId(
		userId: string,
		pagination: PaginationInput,
		filters?: TaskFilterInput,
		sort?: TaskSortInput,
	): Promise<PaginatedList<Task>>
	abstract fetchAllByUserId(
		userId: string,
		filters?: TaskFilterInput,
		sort?: TaskSortInput,
	): Promise<Task[]>
	abstract save(task: Task): Promise<void>
	abstract delete(task: Task): Promise<void>
}
