import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const editCategoryParamSchema = z.object({
	categoryId: z.uuid(),
})

export class EditCategoryParamDto extends createZodDto(editCategoryParamSchema) {}

export const editCategorySchema = z.object({
	name: z.string().min(1).optional(),
	color: z.string().optional(),
})

export class EditCategoryDto extends createZodDto(editCategorySchema) {}
