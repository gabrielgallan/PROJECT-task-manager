import type { Prisma } from 'generated/prisma/browser'
import { PlanData } from '@/domain/task-manager/enterprise/entities/value-objects/plan-data'
import { PrismaPlanMapper } from '../prisma-plan-mapper'

export type PrismaPlanWithData = Prisma.PlanGetPayload<{
	include: {
		task: {
			select: {
				id: true
				title: true
				userId: true
			}
		}
		category: {
			select: {
				id: true
				name: true
				color: true
				userId: true
			}
		}
	}
}>

export class PrismaPlanDataMapper {
	static toDomain(raw: PrismaPlanWithData): PlanData {
		const plan = PrismaPlanMapper.toDomain(raw)
		const task = raw.task?.userId === raw.userId ? raw.task : null
		const category = raw.category?.userId === raw.userId ? raw.category : null

		return PlanData.create({
			id: plan.id.toString(),
			taskId: plan.taskId?.toString() ?? null,
			categoryId: plan.categoryId?.toString() ?? null,
			task: task ? { id: task.id, title: task.title } : null,
			category: category ? { id: category.id, name: category.name, color: category.color } : null,
			title: plan.title,
			description: plan.description ?? null,
			startsAt: plan.startsAt,
			endsAt: plan.endsAt,
			confirmedAt: plan.confirmedAt ?? null,
		})
	}
}
