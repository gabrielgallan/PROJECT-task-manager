import { Plan } from '@/domain/task-manager/enterprise/entities/plan'
import { PlanData } from '@/domain/task-manager/enterprise/entities/value-objects/plan-data'
import { CreatedPlanDto } from '../dtos/created-plan.dto'
import { PlanDto } from '../dtos/plan.dto'

export class PlanPresenter {
	static toHTTP(plan: PlanData): PlanDto {
		return {
			id: plan.id,
			task: plan.task,
			category: plan.category,
			title: plan.title,
			description: plan.description,
			startsAt: plan.startsAt,
			endsAt: plan.endsAt,
			confirmedAt: plan.confirmedAt,
		}
	}

	static toHTTPCreated(plan: Plan): CreatedPlanDto {
		return {
			id: plan.id.toString(),
			taskId: plan.taskId?.toString() ?? null,
			categoryId: plan.categoryId?.toString() ?? null,
			title: plan.title,
			description: plan.description ?? null,
			startsAt: plan.startsAt,
			endsAt: plan.endsAt,
			confirmedAt: plan.confirmedAt ?? null,
			createdAt: plan.createdAt,
			updatedAt: plan.updatedAt ?? null,
		}
	}
}
