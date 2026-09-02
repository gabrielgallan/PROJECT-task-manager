import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { CreatedPlanDto } from '../../dtos/created-plan.dto'

export const createPlanSchema = z.object({
	taskId: z.uuid().optional(),
	categoryId: z.uuid().optional(),
	title: z.string().min(1).max(255),
	description: z.string().max(1000).optional(),
	startsAt: z.iso.datetime().transform((iso) => new Date(iso)),
	endsAt: z.iso.datetime().transform((iso) => new Date(iso)),
})

export class CreatePlanDto extends createZodDto(createPlanSchema) {}

export class CreatePlanResponseDto {
	@ApiProperty({
		type: CreatedPlanDto,
	})
	data!: CreatedPlanDto
}
