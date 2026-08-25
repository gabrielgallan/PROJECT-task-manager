import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const deleteWorkLogSchema = z.object({
	workLogId: z.uuid(),
})

export class DeleteWorkLogDto extends createZodDto(deleteWorkLogSchema) {}
