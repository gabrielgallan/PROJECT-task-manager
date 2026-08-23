import type { Plan } from '../../enterprise/entities/plan'

export type PlanDateRangeInput = {
	from: Date
	to: Date
}

export type PlanFilterInput = {
	taskIds?: string[]
	categoryIds?: string[]
	withoutTask?: boolean
	withoutCategory?: boolean
}

export abstract class PlansRepository {
	abstract create(plan: Plan): Promise<void>
	abstract findById(planId: string): Promise<Plan | null>
	abstract fetchAllByUserId(
		userId: string,
		range: PlanDateRangeInput,
		filters?: PlanFilterInput,
	): Promise<Plan[]>
	abstract fetchAllByTaskId(userId: string, taskId: string): Promise<Plan[]>
	abstract save(plan: Plan): Promise<void>
	abstract delete(plan: Plan): Promise<void>
}
