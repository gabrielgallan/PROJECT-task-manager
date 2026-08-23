import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const createCategorySchema = z.object({
	name: z.string().min(1),
	color: z.string(),
})

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
