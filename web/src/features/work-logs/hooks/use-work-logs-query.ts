import { useQuery } from '@tanstack/react-query'
import { type FetchWorkLogsRequest, fetchWorkLogs } from '@/api/fetch-work-logs'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { toWorkLog, toWorkLogCalendarItem } from '../model/work-log-mappers'
import { normalizeWorkLogRequest, workLogKeys } from '../model/work-log-query-keys'

export function useWorkLogsQuery(request: FetchWorkLogsRequest, timeZone: string, enabled = true) {
	const { generation, busy, ended, capture } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	const normalized = normalizeWorkLogRequest(request)
	return useQuery({
		queryKey: workLogKeys.list(generation, normalized),
		queryFn: async ({ signal }) => {
			const current = capture()
			try {
				return await fetchWorkLogs(normalized, { signal })
			} catch (error) {
				if (!signal.aborted && current()) await revalidateSession(error)
				throw error
			}
		},
		select: (response) =>
			response.data.map(toWorkLog).map((workLog) => toWorkLogCalendarItem(workLog, timeZone)),
		enabled: enabled && !busy && !ended,
		retry: false,
		networkMode: 'always',
		staleTime: 0,
	})
}
