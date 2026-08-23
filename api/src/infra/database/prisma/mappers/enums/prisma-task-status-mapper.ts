import type { TaskStatus as PrismaTaskStatus } from 'generated/prisma/enums'
import type { TaskStatus } from '@/domain/task-manager/enterprise/entities/task'

const toDomain = {
	BACKLOG: 'BACKLOG',
	IN_PROGRESS: 'IN_PROGRESS',
	DONE: 'DONE',
} as const satisfies Record<PrismaTaskStatus, TaskStatus>

const toPrisma = {
	BACKLOG: 'BACKLOG',
	IN_PROGRESS: 'IN_PROGRESS',
	DONE: 'DONE',
} as const satisfies Record<TaskStatus, PrismaTaskStatus>

export class PrismaTaskStatusMapper {
	static toDomain(status: PrismaTaskStatus): TaskStatus {
		return toDomain[status]
	}

	static toPrisma(status: TaskStatus): PrismaTaskStatus {
		return toPrisma[status]
	}
}
