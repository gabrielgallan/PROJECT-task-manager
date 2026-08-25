import { Injectable } from '@nestjs/common'
import type { Prisma } from 'generated/prisma/client'
import {
	PlanDateRangeInput,
	PlanFilterInput,
	PlansRepository,
} from '@/domain/task-manager/application/repositories/plans-repository'
import { Plan } from '@/domain/task-manager/enterprise/entities/plan'
import { PrismaPlanMapper } from '../mappers/prisma-plan-mapper'
import { PrismaPlanDataMapper } from '../mappers/vo/prisma-plan-data-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaPlansRepository implements PlansRepository {
	constructor(private prisma: PrismaService) {}

	async create(plan: Plan) {
		await this.prisma.plan.create({
			data: PrismaPlanMapper.toPrisma(plan),
		})
	}

	async findById(planId: string) {
		const plan = await this.prisma.plan.findUnique({
			where: { id: planId },
		})

		return plan ? PrismaPlanMapper.toDomain(plan) : null
	}

	async fetchAllWithDataByUserId(
		userId: string,
		{ from, to }: PlanDateRangeInput,
		filters?: PlanFilterInput,
	) {
		const plans = await this.prisma.plan.findMany({
			where: this.buildWhere(userId, from, to, filters),
			orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
			include: {
				task: { select: { id: true, title: true, userId: true } },
				category: { select: { id: true, name: true, color: true, userId: true } },
			},
		})

		return plans.map(PrismaPlanDataMapper.toDomain)
	}

	async fetchAllByTaskId(userId: string, taskId: string) {
		const plans = await this.prisma.plan.findMany({
			where: { userId, taskId },
			orderBy: [{ startsAt: 'desc' }, { id: 'asc' }],
		})

		return plans.map(PrismaPlanMapper.toDomain)
	}

	async save(plan: Plan) {
		await this.prisma.plan.update({
			where: { id: plan.id.toString() },
			data: PrismaPlanMapper.toPrisma(plan),
		})
	}

	async delete(plan: Plan) {
		await this.prisma.plan.delete({
			where: { id: plan.id.toString() },
		})
	}

	private buildWhere(
		userId: string,
		from: Date,
		to: Date,
		filters?: PlanFilterInput,
	): Prisma.PlanWhereInput {
		const facets: Prisma.PlanWhereInput[] = []

		if (filters?.taskIds?.length || filters?.withoutTask) {
			const taskOptions: Prisma.PlanWhereInput[] = []

			if (filters.taskIds?.length) taskOptions.push({ taskId: { in: filters.taskIds } })
			if (filters.withoutTask) taskOptions.push({ taskId: null })
			facets.push({ OR: taskOptions })
		}

		if (filters?.categoryIds?.length || filters?.withoutCategory) {
			const categoryOptions: Prisma.PlanWhereInput[] = []

			if (filters.categoryIds?.length) {
				categoryOptions.push({ categoryId: { in: filters.categoryIds } })
			}
			if (filters.withoutCategory) categoryOptions.push({ categoryId: null })
			facets.push({ OR: categoryOptions })
		}

		return {
			userId,
			startsAt: { lt: to },
			endsAt: { gt: from },
			AND: facets.length ? facets : undefined,
		}
	}
}
