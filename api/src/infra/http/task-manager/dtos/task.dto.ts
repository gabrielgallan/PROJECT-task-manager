import { ApiProperty } from '@nestjs/swagger'
import type { TaskPriority, TaskStatus } from '@/domain/task-manager/enterprise/entities/task'

export class TaskDto {
	@ApiProperty()
	title!: string

	@ApiProperty({
		nullable: true,
	})
	description!: string | null

	@ApiProperty()
	status!: TaskStatus

	@ApiProperty()
	priority!: TaskPriority

	@ApiProperty({
		nullable: true,
	})
	startDate!: Date | null

	@ApiProperty({
		nullable: true,
	})
	dueDate!: Date | null

	@ApiProperty({
		nullable: true,
	})
	updatedAt!: Date | null
}
