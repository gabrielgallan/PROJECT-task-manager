import { Injectable } from '@nestjs/common'
import { isAfter, isFuture, isSameDay } from 'date-fns'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { WorkLog } from '../../enterprise/entities/work-log'
import { CategoriesRepository } from '../repositories/categories-repository'
import { TasksRepository } from '../repositories/tasks-repository'
import { WorkLogsRepository } from '../repositories/work-logs-repository'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'

type CreateWorkLogUseCaseRequest = {
	userId: string
	taskId?: string
	categoryId?: string
	title: string
	description?: string
	startsAt: Date
	endsAt: Date
}

type CreateWorkLogUseCaseResponse = Either<
	ResourceNotFoundError | NotAllowedError | InvalidDatetimeError,
	{ workLog: WorkLog }
>

@Injectable()
export class CreateWorkLogUseCase {
	constructor(
		private workLogsRepository: WorkLogsRepository,
		private tasksRepository: TasksRepository,
		private categoriesRepository: CategoriesRepository,
	) {}

	async execute({
		userId,
		taskId,
		categoryId,
		title,
		description,
		startsAt,
		endsAt,
	}: CreateWorkLogUseCaseRequest): Promise<CreateWorkLogUseCaseResponse> {
		if (!isAfter(endsAt, startsAt)) {
			return left(new InvalidDatetimeError('endsAt must be after startsAt'))
		}

		if (!isSameDay(startsAt, endsAt)) {
			return left(new InvalidDatetimeError('startsAt and endsAt must be on the same day'))
		}

		if (isFuture(endsAt)) {
			return left(new InvalidDatetimeError('endsAt cannot be in the future'))
		}

		const overlappingWorkLog = await this.workLogsRepository.findByUserIdOverlapping(
			userId,
			startsAt,
			endsAt,
		)

		if (overlappingWorkLog) {
			return left(new InvalidDatetimeError('The work log interval overlaps an existing work log'))
		}

		if (taskId) {
			const task = await this.tasksRepository.findById(taskId)

			if (!task) return left(new ResourceNotFoundError())

			if (task.userId.toString() !== userId) return left(new NotAllowedError())
		}

		if (categoryId) {
			const category = await this.categoriesRepository.findById(categoryId)

			if (!category) return left(new ResourceNotFoundError())

			if (category.userId.toString() !== userId) return left(new NotAllowedError())
		}

		const workLog = WorkLog.create({
			userId: new UniqueEntityID(userId),
			taskId: taskId ? new UniqueEntityID(taskId) : undefined,
			categoryId: categoryId ? new UniqueEntityID(categoryId) : undefined,
			title,
			description,
			startsAt,
			endsAt,
		})

		await this.workLogsRepository.create(workLog)

		return right({ workLog })
	}
}
