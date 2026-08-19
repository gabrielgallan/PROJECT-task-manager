import { type Either, right } from '@/core/types/either'
import { PaginatedList, PaginationInput } from '@/core/types/pagination'
import { Task } from '../../enterprise/entities/task'
import { TaskFilterInput, TaskSortInput, TasksRepository } from '../repositories/tasks-repository'

type FetchTasksUseCaseRequest = {
	userId: string
	filters?: TaskFilterInput
	sort?: TaskSortInput
	pagination?: PaginationInput
}

type FetchTasksUseCaseResponse = Either<
	null,
	{ data: Task[]; meta: PaginatedList<Task>['meta'] | undefined }
>

export class FetchTasksUseCase {
	constructor(private tasksRepository: TasksRepository) {}

	async execute({
		userId,
		filters,
		sort,
		pagination,
	}: FetchTasksUseCaseRequest): Promise<FetchTasksUseCaseResponse> {
		if (pagination) {
			const result = await this.tasksRepository.listByUserId(userId, pagination, filters, sort)

			return right(result)
		} else {
			const data = await this.tasksRepository.fetchAllByUserId(userId, filters, sort)

			return right({ data, meta: undefined })
		}
	}
}
