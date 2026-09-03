import type { TCategoryColor } from '@/features/categories/model/category-colors'
import { api } from '@/lib/ky'

export interface EditCategoryRequest {
	categoryId: string
	name?: string
	color?: TCategoryColor
}

export async function editCategory({
	categoryId,
	name,
	color,
}: EditCategoryRequest): Promise<void> {
	await api.patch(`api/categories/${categoryId}`, { json: { name, color }, retry: 0 })
}
