import { useMutation } from '@tanstack/react-query'
import { createCategory } from '@/api/create-category'
import { deleteCategory } from '@/api/delete-category'
import { editCategory } from '@/api/edit-category'
import type { FetchCategoriesResponse } from '@/api/fetch-categories'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { categoryKeys } from '../model/category-query-keys'

// Capture session and cache effects together so observer option changes cannot retarget a write.
function useCategoryMutation<TData, TVariables>(
	operation: 'create' | 'edit' | 'delete',
	call: (variables: TVariables) => Promise<TData>,
	updateList?: (
		previous: FetchCategoriesResponse,
		data: TData,
		variables: TVariables,
	) => FetchCategoriesResponse,
	getId?: (variables: TVariables) => string,
) {
	const { generation, capture, client } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	return useMutation({
		mutationKey: categoryKeys.mutation(generation, operation),
		retry: false,
		networkMode: 'always',
		gcTime: 0,
		mutationFn: async (variables: TVariables) => {
			const current = capture()
			const listKey = categoryKeys.list(generation)
			let data: TData
			try {
				data = await call(variables)
			} catch (error) {
				if (current()) {
					if (getHttpStatus(error) === 404) {
						await client.cancelQueries({ queryKey: listKey, exact: true })
						if (current()) await client.invalidateQueries({ queryKey: listKey, exact: true })
					} else {
						await revalidateSession(error)
					}
				}
				throw error
			}
			if (!current()) return data
			await client.cancelQueries({ queryKey: listKey, exact: true })
			if (!current()) return data
			const id = getId?.(variables)
			if (id && operation === 'delete') {
				const queryKey = categoryKeys.deletionImpact(generation, id)
				await client.cancelQueries({ queryKey, exact: true })
				if (!current()) return data
				client.removeQueries({ queryKey, exact: true })
			}
			if (updateList) {
				client.setQueryData<FetchCategoriesResponse>(listKey, (previous) =>
					previous ? updateList(previous, data, variables) : undefined,
				)
			}
			// A failed refetch stays on the list query; the HTTP write has already succeeded.
			await client.invalidateQueries({ queryKey: listKey, exact: true }, { throwOnError: false })
			return data
		},
	})
}

export function useCreateCategory() {
	return useCategoryMutation('create', createCategory, (previous, response) => ({
		data: [...previous.data.filter((item) => item.id !== response.data.id), response.data],
	}))
}

export function useEditCategory() {
	return useCategoryMutation('edit', editCategory)
}

export function useDeleteCategory() {
	return useCategoryMutation(
		'delete',
		deleteCategory,
		(previous, _data, { categoryId }) => ({
			data: previous.data.filter((item) => item.id !== categoryId),
		}),
		({ categoryId }) => categoryId,
	)
}
