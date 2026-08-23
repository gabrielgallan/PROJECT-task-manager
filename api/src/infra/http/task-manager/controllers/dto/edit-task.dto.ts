import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { taskPrioritySchema, taskStatusSchema } from './fetch-tasks.dto'

export const editTaskParamSchema = z.object({
	taskId: z.uuid(),
})

export class EditTaskParamDto extends createZodDto(editTaskParamSchema) {}

export const editTaskSchema = z.object({
	title: z.string().trim().min(1).optional(),
	description: z.string().trim().nullish(),
	status: taskStatusSchema.optional(),
	priority: taskPrioritySchema.optional(),
	startDate: z.iso.date().nullish(),
	dueDate: z.iso.date().nullish(),
})

export class EditTaskDto extends createZodDto(editTaskSchema) {}
