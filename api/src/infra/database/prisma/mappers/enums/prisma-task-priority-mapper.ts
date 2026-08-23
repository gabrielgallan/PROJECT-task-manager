import type { TaskPriority as PrismaTaskPriority } from 'generated/prisma/enums'
import type { TaskPriority } from '@/domain/task-manager/enterprise/entities/task'

const toDomain = {
	LOW: 'LOW',
	MEDIUM: 'MEDIUM',
	HIGH: 'HIGH',
	CRITICAL: 'CRITICAL',
} as const satisfies Record<PrismaTaskPriority, TaskPriority>

const toPrisma = {
	LOW: 'LOW',
	MEDIUM: 'MEDIUM',
	HIGH: 'HIGH',
	CRITICAL: 'CRITICAL',
} as const satisfies Record<TaskPriority, PrismaTaskPriority>

export class PrismaTaskPriorityMapper {
	static toDomain(priority: PrismaTaskPriority): TaskPriority {
		return toDomain[priority]
	}

	static toPrisma(priority: TaskPriority): PrismaTaskPriority {
		return toPrisma[priority]
	}
}
