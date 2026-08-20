import type { Plan } from '../../enterprise/entities/plan'

export abstract class PlansRepository {
	abstract create(plan: Plan): Promise<void>
	abstract findById(planId: string): Promise<Plan | null>
	abstract save(plan: Plan): Promise<void>
}
