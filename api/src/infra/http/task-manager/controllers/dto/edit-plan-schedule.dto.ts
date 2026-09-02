import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const editPlanScheduleParamSchema = z.object({
	planId: z.uuid(),
})

export class EditPlanScheduleParamDto extends createZodDto(editPlanScheduleParamSchema) {}

export const editPlanScheduleSchema = z.object({
	startsAt: z.iso
		.datetime()
		.transform((iso) => new Date(iso))
		.optional(),
	endsAt: z.iso
		.datetime()
		.transform((iso) => new Date(iso))
		.optional(),
})

export class EditPlanScheduleDto extends createZodDto(editPlanScheduleSchema) {}
