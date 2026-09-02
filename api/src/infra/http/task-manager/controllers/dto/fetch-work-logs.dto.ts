import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { WorkLogDto } from '../../dtos/work-log.dto'

export const fetchWorkLogsSchema = z.object({
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

export class FetchWorkLogsDto extends createZodDto(fetchWorkLogsSchema) {}

export class FetchWorkLogsResponseDto {
	@ApiProperty({
		type: WorkLogDto,
		isArray: true,
	})
	data!: WorkLogDto[]
}
