import {
	PlanDateRangeInput,
	PlanFilterInput,
	PlansRepository,
} from '@/domain/task-manager/application/repositories/plans-repository'
import { Plan } from '@/domain/task-manager/enterprise/entities/plan'

export class InMemoryPlansRepository implements PlansRepository {
	public items: Plan[] = []

	async create(plan: Plan) {
		this.items.push(plan)

		return
	}

	async findById(planId: string) {
		const plan = this.items.find((p) => p.id.toString() === planId)

		return plan ?? null
	}

	async fetchAllByUserId(
		userId: string,
		{ from, to }: PlanDateRangeInput,
		filters?: PlanFilterInput,
	) {
		let plans = this.items.filter(
			(plan) =>
				plan.userId.toString() === userId && plan.startsAt < to && plan.endsAt > from,
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

		return plans.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
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
}
