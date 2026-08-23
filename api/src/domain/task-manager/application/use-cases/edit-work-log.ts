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

type EditWorkLogUseCaseRequest = {
	userId: string
	workLogId: string
	taskId?: string | null
	categoryId?: string | null
	title?: string
	description?: string | null
	startsAt?: Date
	endsAt?: Date
}

type EditWorkLogUseCaseResponse = Either<
	ResourceNotFoundError | NotAllowedError | InvalidDatetimeError,
	{ workLog: WorkLog }
>

@Injectable()
export class EditWorkLogUseCase {
	constructor(
		private workLogsRepository: WorkLogsRepository,
		private tasksRepository: TasksRepository,
		private categoriesRepository: CategoriesRepository,
	) {}

	async execute({
		userId,
		workLogId,
		taskId,
		categoryId,
		title,
		description,
		startsAt,
		endsAt,
	}: EditWorkLogUseCaseRequest): Promise<EditWorkLogUseCaseResponse> {
		const workLog = await this.workLogsRepository.findById(workLogId)

		if (!workLog) {
			return left(new ResourceNotFoundError())
		}

		if (workLog.userId.toString() !== userId) {
			return left(new NotAllowedError())
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

		const newStartsAt = startsAt ?? workLog.startsAt

		const newEndsAt = endsAt ?? workLog.endsAt

		if (!isAfter(newEndsAt, newStartsAt)) {
			return left(new InvalidDatetimeError('endsAt must be after startsAt'))
		}

		if (!isSameDay(newStartsAt, newEndsAt)) {
			return left(new InvalidDatetimeError('startsAt and endsAt must be on the same day'))
		}

		if (isFuture(newEndsAt)) {
			return left(new InvalidDatetimeError('endsAt cannot be in the future'))
		}

		const overlappingWorkLog = await this.workLogsRepository.findByUserIdOverlapping(
			userId,
			newStartsAt,
			newEndsAt,
		)

		if (overlappingWorkLog && overlappingWorkLog.id.toString() !== workLogId) {
			return left(new InvalidDatetimeError('The work log interval overlaps an existing work log'))
		}

		if (taskId !== undefined) {
			workLog.taskId = taskId ? new UniqueEntityID(taskId) : null
		}

		if (categoryId !== undefined) {
			workLog.categoryId = categoryId ? new UniqueEntityID(categoryId) : null
		}

		if (title !== undefined) {
			workLog.title = title
		}

		if (description !== undefined) {
			workLog.description = description
		}

		workLog.startsAt = newStartsAt

		workLog.endsAt = newEndsAt

		await this.workLogsRepository.save(workLog)

		return right({ workLog })
	}
}
