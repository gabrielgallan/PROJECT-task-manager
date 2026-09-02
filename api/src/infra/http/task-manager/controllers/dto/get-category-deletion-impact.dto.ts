import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const getCategoryDeletionImpactParamSchema = z.object({
	categoryId: z.uuid(),
})

export class GetCategoryDeletionImpactParamDto extends createZodDto(
	getCategoryDeletionImpactParamSchema,
) {}

export class CategoryDeletionImpactDto {
	@ApiProperty({
		example: 3,
	})
	plansCount!: number

	@ApiProperty({
		example: 12,
	})
	workLogsCount!: number
}

export class GetCategoryDeletionImpactResponseDto {
	@ApiProperty({
		type: CategoryDeletionImpactDto,
	})
	data!: CategoryDeletionImpactDto
}
