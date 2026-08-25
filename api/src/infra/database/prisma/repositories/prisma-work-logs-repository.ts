import { Injectable } from '@nestjs/common'
import type { Prisma } from 'generated/prisma/client'
import {
	WorkLogDateRangeInput,
	WorkLogFilterInput,
	WorkLogsRepository,
} from '@/domain/task-manager/application/repositories/work-logs-repository'
import { WorkLog } from '@/domain/task-manager/enterprise/entities/work-log'
import { PrismaWorkLogMapper } from '../mappers/prisma-work-log-mapper'
import { PrismaWorkLogDataMapper } from '../mappers/vo/prisma-work-log-data-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaWorkLogsRepository implements WorkLogsRepository {
	constructor(private prisma: PrismaService) {}

	async create(workLog: WorkLog) {
		await this.prisma.workLog.create({
			data: PrismaWorkLogMapper.toPrisma(workLog),
		})
	}

	async findByUserIdOverlapping(
		userId: string,
		startsAt: Date,
		endsAt: Date,
		excludeWorkLogId?: string,
	) {
		const workLog = await this.prisma.workLog.findFirst({
			where: {
				userId,
				startsAt: { lt: endsAt },
				endsAt: { gt: startsAt },
				id: excludeWorkLogId ? { not: excludeWorkLogId } : undefined,
			},
			orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
		})

		return workLog ? PrismaWorkLogMapper.toDomain(workLog) : null
	}

	async findById(workLogId: string) {
		const workLog = await this.prisma.workLog.findUnique({
			where: { id: workLogId },
		})

		return workLog ? PrismaWorkLogMapper.toDomain(workLog) : null
	}

	async fetchAllWithDataByUserId(
		userId: string,
		{ from, to }: WorkLogDateRangeInput,
		filters?: WorkLogFilterInput,
	) {
		const workLogs = await this.prisma.workLog.findMany({
			where: this.buildWhere(userId, from, to, filters),
			orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
			include: {
				task: { select: { id: true, title: true, userId: true } },
				category: { select: { id: true, name: true, color: true, userId: true } },
			},
		})

		return workLogs.map(PrismaWorkLogDataMapper.toDomain)
	}

	async fetchAllByTaskId(userId: string, taskId: string) {
		const workLogs = await this.prisma.workLog.findMany({
			where: { userId, taskId },
			orderBy: [{ startsAt: 'desc' }, { id: 'asc' }],
		})

		return workLogs.map(PrismaWorkLogMapper.toDomain)
	}

	async save(workLog: WorkLog) {
		await this.prisma.workLog.update({
			where: { id: workLog.id.toString() },
			data: PrismaWorkLogMapper.toPrisma(workLog),
		})
	}

	async delete(workLog: WorkLog) {
		await this.prisma.workLog.delete({
			where: { id: workLog.id.toString() },
		})
	}

	private buildWhere(
		userId: string,
		from: Date,
		to: Date,
		filters?: WorkLogFilterInput,
	): Prisma.WorkLogWhereInput {
		const facets: Prisma.WorkLogWhereInput[] = []

		if (filters?.taskIds?.length || filters?.withoutTask) {
			const taskOptions: Prisma.WorkLogWhereInput[] = []

			if (filters.taskIds?.length) taskOptions.push({ taskId: { in: filters.taskIds } })
			if (filters.withoutTask) taskOptions.push({ taskId: null })
			facets.push({ OR: taskOptions })
		}

		if (filters?.categoryIds?.length || filters?.withoutCategory) {
			const categoryOptions: Prisma.WorkLogWhereInput[] = []

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
