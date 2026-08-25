import type { Plan } from '../../enterprise/entities/plan'
import type { PlanData } from '../../enterprise/entities/value-objects/plan-data'

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
	abstract fetchAllWithDataByUserId(
		userId: string,
		range: PlanDateRangeInput,
		filters?: PlanFilterInput,
	): Promise<PlanData[]>
	abstract fetchAllByTaskId(userId: string, taskId: string): Promise<Plan[]>
	abstract save(plan: Plan): Promise<void>
	abstract delete(plan: Plan): Promise<void>
}
