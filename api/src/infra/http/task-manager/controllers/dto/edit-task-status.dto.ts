import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { taskStatusSchema } from './fetch-tasks.dto'

export const editTaskStatusParamSchema = z.object({
	taskId: z.uuid(),
})

export class EditTaskStatusParamDto extends createZodDto(editTaskStatusParamSchema) {}

export const editTaskStatusSchema = z.object({
	status: taskStatusSchema,
})

export class EditTaskStatusDto extends createZodDto(editTaskStatusSchema) {}
