import { useQuery } from '@tanstack/react-query'
import { fetchTasks, type FetchTasksRequest } from '@/api/fetch-tasks'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { toTask } from '../model/task-mappers'
import { normalizeTaskRequest, taskKeys } from '../model/task-query-keys'

export function useTasksQuery(params: FetchTasksRequest, enabled = true) {
	const { generation, busy, ended, capture } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	const request = normalizeTaskRequest(params)
	return useQuery({
		queryKey: taskKeys.list(generation, request),
		queryFn: async ({ signal }) => {
			const current = capture()
			try { return await fetchTasks(request, { signal }) }
			catch (error) { if (!signal.aborted && current()) await revalidateSession(error); throw error }
		},
		select: (response) => ({ tasks: response.data.map(toTask), meta: response.meta }),
		enabled: enabled && !busy && !ended, retry: false, networkMode: 'always', staleTime: 0,
	})
}
