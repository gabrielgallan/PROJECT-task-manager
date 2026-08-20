import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { TaskPriority, TaskStatus } from '../../enterprise/entities/task'
import { TasksRepository } from '../repositories/tasks-repository'

type EditTaskUseCaseRequest = {
	userId: string
	taskId: string
	title?: string
	description?: string | null
	status?: TaskStatus
	priority?: TaskPriority
	startDate?: Date | null
	dueDate?: Date | null
}

type EditTaskUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>

@Injectable()
export class EditTaskUseCase {
	constructor(private tasksRepository: TasksRepository) {}

	async execute({
		userId,
		taskId,
		title,
		description,
		status,
		priority,
		startDate,
		dueDate,
	}: EditTaskUseCaseRequest): Promise<EditTaskUseCaseResponse> {
		const task = await this.tasksRepository.findById(taskId)

		if (!task) {
			return left(new ResourceNotFoundError())
		}

		if (task.userId.toString() !== userId) {
			return left(new NotAllowedError())
		}

		if (title !== undefined) task.title = title

		if (description !== undefined) task.description = description

		if (status !== undefined) task.status = status

		if (priority !== undefined) task.priority = priority

		if (startDate !== undefined) task.startDate = startDate

		if (dueDate !== undefined) task.dueDate = dueDate

		await this.tasksRepository.save(task)

		return right(null)
	}
}
