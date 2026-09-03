import type { TCategoryColor } from '@/features/categories/model/category-colors'
import type { ICategory } from '@/features/categories/model/category-types'
import { api } from '@/lib/ky'

export interface CreateCategoryRequest {
	name: string
	color: TCategoryColor
}

export interface CreateCategoryResponse {
	data: ICategory
}

export async function createCategory({
	name,
	color,
}: CreateCategoryRequest): Promise<CreateCategoryResponse> {
	return await api
		.post('api/categories', { json: { name, color }, retry: 0 })
		.json<CreateCategoryResponse>()
}
