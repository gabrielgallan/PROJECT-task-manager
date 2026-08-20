import { PlansRepository } from '@/domain/task-manager/application/repositories/plans-repository'
import { Plan } from '@/domain/task-manager/enterprise/entities/plan'

export class InMemoryPlansRepository implements PlansRepository {
	public items: Plan[] = []

	async create(plan: Plan) {
		this.items.push(plan)

		return
	}
}
