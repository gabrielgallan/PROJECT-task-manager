import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const getTaskDetailsSchema = z.object({
	taskId: z.uuid(),
})

export class GetTaskDetailsDto extends createZodDto(getTaskDetailsSchema) {}
