import { ApiProperty } from '@nestjs/swagger'
import type { TaskPriority, TaskStatus } from '@/domain/task-manager/enterprise/entities/task'

export class TaskDto {
	@ApiProperty({
		example: 'task-uuid',
	})
	id!: string

	@ApiProperty({
		example: 'Implement new feature',
	})
	title!: string

	@ApiProperty({
		nullable: true,
	})
	description!: string | null

	@ApiProperty({
		enum: ['BACKLOG', 'IN_PROGRESS', 'DONE'],
	})
	status!: TaskStatus

	@ApiProperty({
		enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
	})
	priority!: TaskPriority

	@ApiProperty({
		example: '2023-01-01T00:00:00.000Z',
		nullable: true,
	})
	startDate!: Date | null

	@ApiProperty({
		example: '2023-01-31T23:59:59.999Z',
		nullable: true,
	})
	dueDate!: Date | null

	createdAt!: Date

	@ApiProperty({
		example: '2023-01-01T00:00:00.000Z',
		nullable: true,
	})
	updatedAt!: Date | null
}
