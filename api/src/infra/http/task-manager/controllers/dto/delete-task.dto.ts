import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const deleteTaskSchema = z.object({
	taskId: z.uuid(),
})

export class DeleteTaskDto extends createZodDto(deleteTaskSchema) {}
