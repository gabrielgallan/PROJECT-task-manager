import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const deleteCategoryParamSchema = z.object({
	categoryId: z.uuid(),
})

export class DeleteCategoryParamDto extends createZodDto(deleteCategoryParamSchema) {}
