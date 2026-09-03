import { useQuery } from '@tanstack/react-query'
import { fetchSessions } from '@/api/fetch-sessions'
import { sessionsQueryKey } from '../model/identity'
import { useIdentityLifecycle } from './use-end-session'

export function useSessions(enabled: boolean) {
	const { busy, ended } = useIdentityLifecycle()
	return useQuery({
		queryKey: sessionsQueryKey,
		queryFn: fetchSessions,
		retry: false,
		enabled: enabled && !busy && !ended,
	})
}
