import type { ICategory } from '@/features/categories/model/category-types'
import { api } from '@/lib/ky'

export interface FetchCategoriesResponse {
	data: ICategory[]
}

export interface FetchCategoriesOptions {
	signal?: AbortSignal
}

export async function fetchCategories({
	signal,
}: FetchCategoriesOptions = {}): Promise<FetchCategoriesResponse> {
	return await api.get('api/categories', { signal, retry: 0 }).json<FetchCategoriesResponse>()
}
