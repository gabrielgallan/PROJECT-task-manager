import type { Plan } from '../../enterprise/entities/plan'

export interface PlansRepository {
	create(plan: Plan): Promise<void>
}
