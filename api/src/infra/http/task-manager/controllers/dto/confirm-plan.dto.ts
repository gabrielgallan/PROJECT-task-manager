import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const confirmPlanParamSchema = z.object({
	planId: z.uuid(),
})

export class ConfirmPlanParamDto extends createZodDto(confirmPlanParamSchema) {}

export const confirmPlanSchema = z.object({
	timeZone: z.string().min(1).max(255),
})

export class ConfirmPlanDto extends createZodDto(confirmPlanSchema) {}
