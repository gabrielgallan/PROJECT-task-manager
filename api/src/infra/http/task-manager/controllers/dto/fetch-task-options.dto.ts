import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const fetchTaskOptionsSchema = z.object({
	q: z.string().trim().max(100).optional(),
	limit: z.coerce.number().int().positive().max(50).default(20),
	cursor: z.string().min(1).max(1000).optional(),
})

export class FetchTaskOptionsDto extends createZodDto(fetchTaskOptionsSchema) {}
