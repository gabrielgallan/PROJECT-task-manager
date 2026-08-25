import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const editWorkLogParamSchema = z.object({
	workLogId: z.uuid(),
})

export class EditWorkLogParamDto extends createZodDto(editWorkLogParamSchema) {}

export const editWorkLogSchema = z.object({
	taskId: z.uuid().nullish(),
	categoryId: z.uuid().nullish(),
	title: z.string().min(1).max(255).optional(),
	description: z.string().max(1000).nullish(),
	startsAt: z.iso
		.datetime()
		.transform((iso) => new Date(iso))
		.optional(),
	endsAt: z.iso
		.datetime()
		.transform((iso) => new Date(iso))
		.optional(),
	timeZone: z.string().min(1).max(255),
})

export class EditWorkLogDto extends createZodDto(editWorkLogSchema) {}
