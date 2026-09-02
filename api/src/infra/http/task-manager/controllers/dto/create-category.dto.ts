import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { CATEGORY_COLORS } from '@/domain/task-manager/enterprise/entities/category'
import { CategoryDto } from '../../dtos/category.dto'

export const categoryColorSchema = z.enum(CATEGORY_COLORS)

export const categoryNameSchema = z.string().trim().min(1).max(40)

export const createCategorySchema = z.object({
	name: categoryNameSchema,
	color: categoryColorSchema,
})

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}

export class CreateCategoryResponseDto {
	@ApiProperty({
		type: CategoryDto,
	})
	data!: CategoryDto
}
