import { type Either, right } from '@/core/types/either'
import { type TaskPriority, type TaskStatus } from '../../enterprise/entities/task'

type TaskFilterInput = {
	search?: string
	status?: TaskStatus[]
	priority?: TaskPriority[]
}

type TaskSortInput = {
	by: 'title' | 'status' | 'priority' | 'updatedAt' | 'dueDate'
	dir: 'asc' | 'desc'
}

type FetchTasksUseCaseRequest = {
	userId: string
	filters?: TaskFilterInput
	sort?: TaskSortInput
}

type FetchTasksUseCaseResponse = Either<null, null>

export class FetchTasksUseCase {
	async execute({ userId }: FetchTasksUseCaseRequest): Promise<FetchTasksUseCaseResponse> {
		return right(null)
	}
}
