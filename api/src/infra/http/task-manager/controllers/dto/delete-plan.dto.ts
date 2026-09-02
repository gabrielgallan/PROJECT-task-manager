import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const deletePlanParamSchema = z.object({
	planId: z.uuid(),
})

export class DeletePlanParamDto extends createZodDto(deletePlanParamSchema) {}
