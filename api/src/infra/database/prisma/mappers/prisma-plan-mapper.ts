import type { Plan as PrismaPlan, Prisma } from 'generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Plan } from '@/domain/task-manager/enterprise/entities/plan'

export class PrismaPlanMapper {
	static toDomain(raw: PrismaPlan): Plan {
		return Plan.create(
			{
				userId: new UniqueEntityID(raw.userId),
				taskId: raw.taskId ? new UniqueEntityID(raw.taskId) : null,
				categoryId: raw.categoryId ? new UniqueEntityID(raw.categoryId) : null,
				title: raw.title,
				description: raw.description,
				startsAt: raw.startsAt,
				endsAt: raw.endsAt,
				confirmedAt: raw.confirmedAt,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
			},
			new UniqueEntityID(raw.id),
		)
	}

	static toPrisma(plan: Plan): Prisma.PlanUncheckedCreateInput {
		return {
			id: plan.id.toString(),
			userId: plan.userId.toString(),
			taskId: plan.taskId?.toString() ?? null,
			categoryId: plan.categoryId?.toString() ?? null,
			title: plan.title,
			description: plan.description,
			startsAt: plan.startsAt,
			endsAt: plan.endsAt,
			confirmedAt: plan.confirmedAt,
			createdAt: plan.createdAt,
			updatedAt: plan.updatedAt,
		}
	}
}
