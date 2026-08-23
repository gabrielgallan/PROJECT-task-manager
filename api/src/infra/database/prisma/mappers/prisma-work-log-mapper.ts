import type { Prisma, WorkLog as PrismaWorkLog } from 'generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { WorkLog } from '@/domain/task-manager/enterprise/entities/work-log'

export class PrismaWorkLogMapper {
	static toDomain(raw: PrismaWorkLog): WorkLog {
		return WorkLog.create(
			{
				userId: new UniqueEntityID(raw.userId),
				taskId: raw.taskId ? new UniqueEntityID(raw.taskId) : null,
				categoryId: raw.categoryId ? new UniqueEntityID(raw.categoryId) : null,
				title: raw.title,
				description: raw.description,
				startsAt: raw.startsAt,
				endsAt: raw.endsAt,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
			},
			new UniqueEntityID(raw.id),
		)
	}

	static toPrisma(workLog: WorkLog): Prisma.WorkLogUncheckedCreateInput {
		return {
			id: workLog.id.toString(),
			userId: workLog.userId.toString(),
			taskId: workLog.taskId?.toString() ?? null,
			categoryId: workLog.categoryId?.toString() ?? null,
			title: workLog.title,
			description: workLog.description,
			startsAt: workLog.startsAt,
			endsAt: workLog.endsAt,
			createdAt: workLog.createdAt,
			updatedAt: workLog.updatedAt,
		}
	}
}
