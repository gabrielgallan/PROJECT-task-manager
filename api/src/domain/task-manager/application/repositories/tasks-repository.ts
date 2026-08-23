import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { CursorPaginatedList } from '@/core/types/cursor-pagination'
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

export type TaskOption = {
	id: UniqueEntityID
	title: string
}

export type TaskOptionsInput = {
	search?: string
	limit: number
	cursor?: TaskOptionsCursor
}

export abstract class TasksRepository {
	abstract create(task: Task): Promise<void>
	abstract findById(taskId: string): Promise<Task | null>
	abstract fetchOptionsByUserId(
		userId: string,
		input: TaskOptionsInput,
	): Promise<CursorPaginatedList<TaskOption, TaskOptionsCursor>>
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
