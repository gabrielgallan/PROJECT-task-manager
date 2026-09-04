import { useQuery } from '@tanstack/react-query'
import { type FetchPlansRequest, fetchPlans } from '@/api/fetch-plans'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { toPlan, toPlanCalendarItem } from '../model/plan-mappers'
import { normalizePlanRequest, planKeys } from '../model/plan-query-keys'

export function usePlansQuery(request: FetchPlansRequest, timeZone: string, enabled = true) {
	const { generation, busy, ended, capture } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	const normalized = normalizePlanRequest(request)
	return useQuery({
		queryKey: planKeys.list(generation, normalized),
		queryFn: async ({ signal }) => {
			const current = capture()
			try {
				return await fetchPlans(normalized, { signal })
			} catch (error) {
				if (!signal.aborted && current()) await revalidateSession(error)
				throw error
			}
		},
		select: (response) =>
			response.data.map(toPlan).map((plan) => toPlanCalendarItem(plan, timeZone)),
		enabled: enabled && !busy && !ended,
		retry: false,
		networkMode: 'always',
		staleTime: 0,
	})
}
