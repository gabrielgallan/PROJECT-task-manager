import { Injectable } from '@nestjs/common'
import { isBefore } from 'date-fns'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { type Either, left, right } from '@/core/types/either'
import type { Plan } from '../../enterprise/entities/plan'
import { CategoriesRepository } from '../repositories/categories-repository'
import { PlanFilterInput, PlansRepository } from '../repositories/plans-repository'
import { TasksRepository } from '../repositories/tasks-repository'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'

type FetchPlansUseCaseRequest = {
	userId: string
	from: Date
	to: Date
	filters?: PlanFilterInput
}

type PlanTaskSummary = {
	id: UniqueEntityID
	title: string
}

type PlanCategorySummary = {
	id: UniqueEntityID
	name: string
	color: string
}

type FetchPlansUseCaseResponse = Either<
	InvalidDatetimeError,
	{
		data: Array<{
			plan: Plan
			task: PlanTaskSummary | null
			category: PlanCategorySummary | null
		}>
	}
>

@Injectable()
export class FetchPlansUseCase {
	constructor(
		private plansRepository: PlansRepository,
		private tasksRepository: TasksRepository,
		private categoriesRepository: CategoriesRepository,
	) {}

	async execute({
		userId,
		from,
		to,
		filters,
	}: FetchPlansUseCaseRequest): Promise<FetchPlansUseCaseResponse> {
		if (!isBefore(from, to)) {
			return left(new InvalidDatetimeError('to must be after from'))
		}

		const [plans, tasks, categories] = await Promise.all([
			this.plansRepository.fetchAllByUserId(userId, { from, to }, filters),
			this.tasksRepository.fetchAllByUserId(userId),
			this.categoriesRepository.fetchAllByUserId(userId),
		])

		const tasksById = new Map(tasks.map((task) => [task.id.toString(), task]))
		const categoriesById = new Map(
			categories.map((category) => [category.id.toString(), category]),
		)

		const data = plans.map((plan) => {
			const task = plan.taskId ? tasksById.get(plan.taskId.toString()) : undefined
			const category = plan.categoryId
				? categoriesById.get(plan.categoryId.toString())
				: undefined

			return {
				plan,
				task: task ? { id: task.id, title: task.title } : null,
				category: category
					? { id: category.id, name: category.name, color: category.color }
					: null,
			}
		})

		return right({ data })
	}
}
