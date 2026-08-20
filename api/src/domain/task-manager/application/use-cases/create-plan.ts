import { Injectable } from '@nestjs/common'
import { isAfter } from 'date-fns'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { Plan } from '../../enterprise/entities/plan'
import { CategoriesRepository } from '../repositories/categories-repository'
import { PlansRepository } from '../repositories/plans-repository'
import { TasksRepository } from '../repositories/tasks-repository'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'

type CreatePlanUseCaseRequest = {
	userId: string
	taskId?: string
	categoryId?: string
	title: string
	description?: string
	startsAt: Date
	endsAt: Date
}

type CreatePlanUseCaseResponse = Either<
	ResourceNotFoundError | NotAllowedError | InvalidDatetimeError,
	{ plan: Plan }
>

@Injectable()
export class CreatePlanUseCase {
	constructor(
		private plansRepository: PlansRepository,
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
	}: CreatePlanUseCaseRequest): Promise<CreatePlanUseCaseResponse> {
		if (!isAfter(endsAt, startsAt)) {
			return left(new InvalidDatetimeError('endsAt must be after startsAt'))
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

		const plan = Plan.create({
			userId: new UniqueEntityID(userId),
			taskId: taskId ? new UniqueEntityID(taskId) : undefined,
			categoryId: categoryId ? new UniqueEntityID(categoryId) : undefined,
			title,
			description,
			startsAt,
			endsAt,
		})

		await this.plansRepository.create(plan)

		return right({ plan })
	}
}
