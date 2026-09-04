import { z } from 'zod/v4'

export const workLogIdSchema = z.uuid()
export const workLogSchema = z.object({
	title: z.string().trim().min(1, 'Title is required').max(255, 'Title is too long'),
	description: z.string().max(1000, 'Description is too long'),
	startDate: z.date('Start date is required'),
	endDate: z.date('End date is required'),
	taskId: z.uuid('Select a valid task').nullable(),
	categoryId: z.uuid('Select a valid category').nullable(),
})

export type TWorkLogFormData = z.infer<typeof workLogSchema>
