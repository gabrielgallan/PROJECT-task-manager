import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { PlanDto } from '../../dtos/plan.dto'

export const fetchPlansSchema = z.object({
	from: z.iso.datetime().transform((iso) => new Date(iso)),
	to: z.iso.datetime().transform((iso) => new Date(iso)),
	taskId: z
		.union([z.string(), z.array(z.string())])
		.transform((value) => (Array.isArray(value) ? value : [value]))
		.optional(),
	categoryId: z
		.union([z.string(), z.array(z.string())])
		.transform((value) => (Array.isArray(value) ? value : [value]))
		.optional(),
	withoutTask: z
		.string()
		.transform((value) => value === 'true')
		.optional(),
	withoutCategory: z
		.string()
		.transform((value) => value === 'true')
		.optional(),
})

export class FetchPlansDto extends createZodDto(fetchPlansSchema) {}

export class FetchPlansResponseDto {
	@ApiProperty({
		type: PlanDto,
		isArray: true,
	})
	data!: PlanDto[]
}
