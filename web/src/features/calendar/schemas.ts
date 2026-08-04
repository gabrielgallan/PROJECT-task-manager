import { z } from 'zod/v4'
import { PLAN_COLORS } from '@/features/calendar/constants'
import type { TPlanColor } from '@/features/calendar/types'

export const planSchema = z
	.object({
		title: z.string().min(1, 'Title is required'),
		description: z.string().optional(),
		startDate: z.date('Start date is required'),
		endDate: z.date('End date is required'),
		color: z.enum(PLAN_COLORS as [TPlanColor, ...TPlanColor[]]),
		taskId: z.string().nullable().optional(),
	})
	.refine((data) => data.endDate > data.startDate, {
		message: 'End must be after start',
		path: ['endDate'],
	})

export type TPlanFormData = z.infer<typeof planSchema>
