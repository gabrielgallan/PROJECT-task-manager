import { z } from 'zod/v4'
import { CATEGORY_COLORS } from '@/features/categories/model/category-colors'

export const categorySchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(40, 'Name must be 40 characters or less'),
	color: z.enum(CATEGORY_COLORS, { error: 'Select a valid color' }),
})

export type TCategoryFormData = z.infer<typeof categorySchema>
