import { z } from 'zod/v4'

export const planSchema = z
	.object({
		title: z.string().min(1, 'Title is required'),
		description: z.string().optional(),
		startDate: z.date('Start date is required'),
		endDate: z.date('End date is required'),
		taskId: z.string().nullable().optional(),
		categoryId: z.string().nullable().optional(),
	})
	.refine((data) => data.endDate > data.startDate, {
		message: 'End must be after start',
		path: ['endDate'],
	})

export type TPlanFormData = z.infer<typeof planSchema>
