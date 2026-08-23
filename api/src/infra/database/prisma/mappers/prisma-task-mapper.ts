import type { Prisma, Task as PrismaTask } from 'generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Task } from '@/domain/task-manager/enterprise/entities/task'
import { PrismaTaskPriorityMapper } from './enums/prisma-task-priority-mapper'
import { PrismaTaskStatusMapper } from './enums/prisma-task-status-mapper'

export class PrismaTaskMapper {
	static toDomain(raw: PrismaTask): Task {
		return Task.create(
			{
				userId: new UniqueEntityID(raw.userId),
				title: raw.title,
				description: raw.description,
				status: PrismaTaskStatusMapper.toDomain(raw.status),
				priority: PrismaTaskPriorityMapper.toDomain(raw.priority),
				startDate: raw.startDate,
				dueDate: raw.dueDate,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
			},
			new UniqueEntityID(raw.id),
		)
	}

	static toPrisma(task: Task): Prisma.TaskUncheckedCreateInput {
		return {
			id: task.id.toString(),
			userId: task.userId.toString(),
			title: task.title,
			description: task.description,
			status: PrismaTaskStatusMapper.toPrisma(task.status),
			priority: PrismaTaskPriorityMapper.toPrisma(task.priority),
			startDate: task.startDate,
			dueDate: task.dueDate,
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
		}
	}
}
