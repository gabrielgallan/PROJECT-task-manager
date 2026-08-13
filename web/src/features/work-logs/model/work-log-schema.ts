import { isSameDay } from 'date-fns'
import { z } from 'zod/v4'

export const workLogSchema = z
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
	.refine((data) => isSameDay(data.startDate, data.endDate), {
		message: 'A work log must start and end on the same day',
		path: ['endDate'],
	})
	.refine((data) => data.endDate <= new Date(), {
		message: 'Work logs record time already spent',
		path: ['endDate'],
	})

export type TWorkLogFormData = z.infer<typeof workLogSchema>
