import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const fetchWorkLogsSchema = z.object({
	from: z.iso.datetime().transform((iso) => new Date(iso)),
	to: z.iso.datetime().transform((iso) => new Date(iso)),
	filters: z
		.object({
			taskIds: z
				.union([z.string(), z.array(z.string())])
				.transform((value) => (Array.isArray(value) ? value : [value]))
				.optional(),
			categoryIds: z
				.union([z.string(), z.array(z.string())])
				.transform((value) => (Array.isArray(value) ? value : [value]))
				.optional(),
			withoutTask: z.boolean().optional(),
			withoutCategory: z.boolean().optional(),
		})
		.optional(),
})

export class FetchWorkLogsDto extends createZodDto(fetchWorkLogsSchema) {}
