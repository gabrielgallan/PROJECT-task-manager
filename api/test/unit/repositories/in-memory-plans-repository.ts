import {
	PlanDateRangeInput,
	PlanFilterInput,
	PlansRepository,
} from '@/domain/task-manager/application/repositories/plans-repository'
import { Plan } from '@/domain/task-manager/enterprise/entities/plan'
import { PlanData } from '@/domain/task-manager/enterprise/entities/value-objects/plan-data'
import type { InMemoryCategoriesRepository } from './in-memory-categories-repository'
import type { InMemoryTasksRepository } from './in-memory-tasks-repository'

export class InMemoryPlansRepository implements PlansRepository {
	constructor(
		private tasksRepository: InMemoryTasksRepository,
		private categoriesRepositoryProvider: () => InMemoryCategoriesRepository,
	) {}

	public items: Plan[] = []

	async create(plan: Plan) {
		this.items.push(plan)

		return
	}

	async findById(planId: string) {
		const plan = this.items.find((p) => p.id.toString() === planId)

		return plan ?? null
	}

	async fetchAllWithDataByUserId(
		userId: string,
		{ from, to }: PlanDateRangeInput,
		filters?: PlanFilterInput,
	) {
		let plans = this.items.filter(
			(plan) => plan.userId.toString() === userId && plan.startsAt < to && plan.endsAt > from,
		)

		const hasTaskFilter = Boolean(filters?.taskIds?.length || filters?.withoutTask)

		if (hasTaskFilter) {
			plans = plans.filter((plan) => {
				const matchesTask = plan.taskId
					? filters?.taskIds?.includes(plan.taskId.toString())
					: filters?.withoutTask

				return Boolean(matchesTask)
			})
		}

		const hasCategoryFilter = Boolean(filters?.categoryIds?.length || filters?.withoutCategory)

		if (hasCategoryFilter) {
			plans = plans.filter((plan) => {
				const matchesCategory = plan.categoryId
					? filters?.categoryIds?.includes(plan.categoryId.toString())
					: filters?.withoutCategory

				return Boolean(matchesCategory)
			})
		}

		return plans
			.sort(
				(a, b) =>
					a.startsAt.getTime() - b.startsAt.getTime() ||
					a.id.toString().localeCompare(b.id.toString()),
			)
			.map((plan) => this.toPlanData(plan))
	}

	async fetchAllByTaskId(userId: string, taskId: string) {
		return this.items
			.filter((plan) => plan.userId.toString() === userId && plan.taskId?.toString() === taskId)
			.sort(
				(a, b) =>
					b.startsAt.getTime() - a.startsAt.getTime() ||
					a.id.toString().localeCompare(b.id.toString()),
			)
	}

	async save(plan: Plan) {
		const planIndex = this.items.findIndex((p) => p.id.toString() === plan.id.toString())

		if (planIndex >= 0) {
			this.items[planIndex] = plan
		}

		return
	}

	async delete(plan: Plan) {
		this.items = this.items.filter((p) => p.id.toString() !== plan.id.toString())

		return
	}

	private toPlanData(plan: Plan) {
		const taskId = plan.taskId
		const categoryId = plan.categoryId
		const task = taskId
			? this.tasksRepository.items.find(
					(item) => item.id.equals(taskId) && item.userId.toString() === plan.userId.toString(),
				)
			: undefined
		const category = categoryId
			? this.categoriesRepositoryProvider().items.find(
					(item) => item.id.equals(categoryId) && item.userId.toString() === plan.userId.toString(),
				)
			: undefined

		return PlanData.create({
			id: plan.id.toString(),
			taskId: plan.taskId?.toString() ?? null,
			categoryId: plan.categoryId?.toString() ?? null,
			task: task ? { id: task.id.toString(), title: task.title } : null,
			category: category
				? { id: category.id.toString(), name: category.name, color: category.color }
				: null,
			title: plan.title,
			description: plan.description ?? null,
			startsAt: plan.startsAt,
			endsAt: plan.endsAt,
			confirmedAt: plan.confirmedAt ?? null,
		})
	}
}
