import { api } from '@/lib/ky'

export interface DeleteCategoryRequest {
	categoryId: string
}

export async function deleteCategory({ categoryId }: DeleteCategoryRequest): Promise<void> {
	await api.delete(`api/categories/${categoryId}`, { retry: 0 })
}
