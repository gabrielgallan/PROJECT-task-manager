import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const editPlanParamSchema = z.object({
	planId: z.uuid(),
})

export class EditPlanParamDto extends createZodDto(editPlanParamSchema) {}

export const editPlanSchema = z.object({
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
})

export class EditPlanDto extends createZodDto(editPlanSchema) {}
