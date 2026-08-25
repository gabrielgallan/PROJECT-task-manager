import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createWorkLogSchema = z.object({
	taskId: z.uuid().optional(),
	categoryId: z.uuid().optional(),
	title: z.string().min(1).max(255),
	description: z.string().max(1000).optional(),
	startsAt: z.iso.datetime().transform((iso) => new Date(iso)),
	endsAt: z.iso.datetime().transform((iso) => new Date(iso)),
	timeZone: z.string().min(1).max(255),
})

export class CreateWorkLogDto extends createZodDto(createWorkLogSchema) {}
