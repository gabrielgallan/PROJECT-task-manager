import type { Plan } from '../../enterprise/entities/plan'

export abstract class PlansRepository {
	abstract create(plan: Plan): Promise<void>
}
