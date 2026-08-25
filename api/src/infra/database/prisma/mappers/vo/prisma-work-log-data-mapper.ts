import type { Prisma } from 'generated/prisma/browser'
import { WorkLogData } from '@/domain/task-manager/enterprise/entities/value-objects/work-log-data'
import { PrismaWorkLogMapper } from '../prisma-work-log-mapper'

export type PrismaWorkLogWithData = Prisma.WorkLogGetPayload<{
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

export class PrismaWorkLogDataMapper {
	static toDomain(raw: PrismaWorkLogWithData): WorkLogData {
		const workLog = PrismaWorkLogMapper.toDomain(raw)
		const task = raw.task?.userId === raw.userId ? raw.task : null
		const category = raw.category?.userId === raw.userId ? raw.category : null

		return WorkLogData.create({
			id: workLog.id.toString(),
			taskId: workLog.taskId?.toString() ?? null,
			categoryId: workLog.categoryId?.toString() ?? null,
			task: task ? { id: task.id, title: task.title } : null,
			category: category ? { id: category.id, name: category.name, color: category.color } : null,
			title: workLog.title,
			description: workLog.description ?? null,
			startsAt: workLog.startsAt,
			endsAt: workLog.endsAt,
			createdAt: workLog.createdAt,
			updatedAt: workLog.updatedAt ?? null,
		})
	}
}
