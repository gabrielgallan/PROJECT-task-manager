import { type Either } from '@/core/types/either'
import { Task } from '../../enterprise/entities/task'
import { TasksRepository } from '../repositories/tasks-repository'

type FetchTasksWithCursorUseCaseRequest = {
	userId: string
	search?: string
}

type FetchTasksWithCursorUseCaseResponse = Either<null, { data: Task[] }>

export class FetchTasksWithCursorUseCase {
	constructor(_tasksRepository: TasksRepository) {}

	async execute({
		userId,
		search,
	}: FetchTasksWithCursorUseCaseRequest): Promise<FetchTasksWithCursorUseCaseResponse> {}
}
