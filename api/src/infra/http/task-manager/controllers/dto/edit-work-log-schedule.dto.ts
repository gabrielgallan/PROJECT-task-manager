import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const editWorkLogScheduleParamSchema = z.object({
	workLogId: z.uuid(),
})

export class EditWorkLogScheduleParamDto extends createZodDto(editWorkLogScheduleParamSchema) {}

export const editWorkLogScheduleSchema = z.object({
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

export class EditWorkLogScheduleDto extends createZodDto(editWorkLogScheduleSchema) {}
