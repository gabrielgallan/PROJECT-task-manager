import { z } from 'zod/v4'

export const planIdSchema = z.uuid()
export const planFormSchema = z.object({
	title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
	description: z.string().max(1000, 'Description must be at most 1000 characters'),
	startDate: z.date('Start date is required'),
	endDate: z.date('End date is required'),
	taskId: z.uuid().nullable(),
	categoryId: z.uuid().nullable(),
})
export const planSchema = planFormSchema

export type TPlanFormData = z.infer<typeof planSchema>
