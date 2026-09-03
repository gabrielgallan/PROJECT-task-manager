import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTaskOptions } from '@/api/fetch-task-options'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { taskKeys } from '../model/task-query-keys'
import { taskOptionsSearchSchema } from '../model/task-schema'

export function useTaskOptionsQuery(q: string, enabled: boolean) {
	const { generation, busy, ended, capture } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	const client = useQueryClient()
	const queryKey = taskKeys.optionSearch(generation, q, 20)
	const query = useInfiniteQuery({
		queryKey,
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ signal, pageParam }) => {
			const current = capture()
			try {
				return await fetchTaskOptions({ q, limit: 20, cursor: pageParam }, { signal })
			} catch (error) {
				if (!signal.aborted && current()) await revalidateSession(error)
				throw error
			}
		},
		getNextPageParam: (page) => page.meta.nextCursor ?? undefined,
		enabled: enabled && !busy && !ended && taskOptionsSearchSchema.safeParse({ q }).success,
		retry: false,
		networkMode: 'always',
		staleTime: 0,
	})
	return {
		...query,
		restart: () => client.resetQueries({ queryKey, exact: true }),
	}
}
