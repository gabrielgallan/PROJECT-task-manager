import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { TasksRepository } from '../repositories/tasks-repository'

type DeleteTaskUseCaseRequest = {
	userId: string
	taskId: string
}

type DeleteTaskUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>

@Injectable()
export class DeleteTaskUseCase {
	constructor(private tasksRepository: TasksRepository) {}

	async execute({ userId, taskId }: DeleteTaskUseCaseRequest): Promise<DeleteTaskUseCaseResponse> {
		const task = await this.tasksRepository.findById(taskId)

		if (!task) {
			return left(new ResourceNotFoundError())
		}

		if (task.userId.toString() !== userId) {
			return left(new NotAllowedError())
		}

		await this.tasksRepository.delete(task)

		return right(null)
	}
}
