import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { z } from 'zod'
import { getCategoryDeletionImpact } from '@/api/get-category-deletion-impact'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { categoryKeys } from '../model/category-query-keys'

export function useCategoryDeletionImpact(categoryId: string, enabled: boolean) {
	const { generation, busy, ended, capture, client } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	const validId = z.uuid().safeParse(categoryId).success
	const query = useQuery({
		queryKey: categoryKeys.deletionImpact(generation, categoryId),
		queryFn: async ({ signal }) => {
			const current = capture()
			try {
				return await getCategoryDeletionImpact({ categoryId }, { signal })
			} catch (error) {
				if (!signal.aborted && current()) await revalidateSession(error)
				throw error
			}
		},
		enabled: enabled && validId && !busy && !ended,
		retry: false,
		networkMode: 'always',
		staleTime: 0,
	})

	useEffect(
		() => () => {
			void client.cancelQueries({
				queryKey: categoryKeys.deletionImpact(generation, categoryId),
				exact: true,
			})
		},
		[client, generation, categoryId],
	)

	return { ...query, validId }
}
