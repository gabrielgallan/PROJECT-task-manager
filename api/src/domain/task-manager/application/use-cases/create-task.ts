import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { type Either, right } from '@/core/types/either'
import { Task, type TaskPriority, type TaskStatus } from '../../enterprise/entities/task'
import { TasksRepository } from '../repositories/tasks-repository'

type CreateTaskUseCaseRequest = {
	userId: string
	title: string
	description?: string
	status?: TaskStatus
	priority?: TaskPriority
	startDate?: Date
	dueDate?: Date
}

type CreateTaskUseCaseResponse = Either<null, { task: Task }>

@Injectable()
export class CreateTaskUseCase {
	constructor(private tasksRepository: TasksRepository) {}

	async execute({
		userId,
		title,
		description,
		status,
		priority,
		startDate,
		dueDate,
	}: CreateTaskUseCaseRequest): Promise<CreateTaskUseCaseResponse> {
		const task = Task.create({
			userId: new UniqueEntityID(userId),
			title,
			description,
			status,
			priority,
			startDate,
			dueDate,
		})

		await this.tasksRepository.create(task)

		return right({ task })
	}
}
