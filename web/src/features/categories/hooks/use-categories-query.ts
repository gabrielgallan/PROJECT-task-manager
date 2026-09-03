import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '@/api/fetch-categories'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { categoryKeys } from '../model/category-query-keys'

export function useCategoriesQuery() {
	const { generation, busy, ended, capture } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	return useQuery({
		queryKey: categoryKeys.list(generation),
		queryFn: async ({ signal }) => {
			const current = capture()
			try {
				return await fetchCategories({ signal })
			} catch (error) {
				if (!signal.aborted && current()) await revalidateSession(error)
				throw error
			}
		},
		enabled: !busy && !ended,
		retry: false,
		networkMode: 'always',
		staleTime: 0,
	})
}
