import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { categoryColorSchema, categoryNameSchema } from './create-category.dto'

export const editCategoryParamSchema = z.object({
	categoryId: z.uuid(),
})

export class EditCategoryParamDto extends createZodDto(editCategoryParamSchema) {}

export const editCategorySchema = z.object({
	name: categoryNameSchema.optional(),
	color: categoryColorSchema.optional(),
})

export class EditCategoryDto extends createZodDto(editCategorySchema) {}
