import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { TaskDto } from '../../dtos/task.dto'
import { taskPrioritySchema, taskStatusSchema } from './fetch-tasks.dto'

export const createTaskSchema = z.object({
	title: z.string().trim().min(1),
	description: z.string().trim().optional(),
	status: taskStatusSchema.default('BACKLOG'),
	priority: taskPrioritySchema.default('LOW'),
	startDate: z.iso.date().optional(),
	dueDate: z.iso.date().optional(),
})

export class CreateTaskDto extends createZodDto(createTaskSchema) {}

export class CreateTaskResponseDto {
	@ApiProperty({
		type: TaskDto,
	})
	data!: TaskDto
}
