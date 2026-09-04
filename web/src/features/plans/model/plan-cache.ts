import type { QueryClient } from '@tanstack/react-query'
import type { EditPlanScheduleRequest } from '@/api/edit-plan-schedule'
import type { FetchPlansResponse } from '@/api/fetch-plans'
import { planKeys } from './plan-query-keys'

function overlaps(startsAt: string, endsAt: string, from: string, to: string) {
	return Date.parse(startsAt) < Date.parse(to) && Date.parse(endsAt) > Date.parse(from)
}

export async function reconcilePlans(
	client: QueryClient,
	generation: number,
	current: () => boolean,
	options: { removeId?: string; schedule?: EditPlanScheduleRequest } = {},
) {
	const listKey = planKeys.lists(generation)
	await client.cancelQueries({ queryKey: listKey })
	if (!current()) return
	if (options.removeId || options.schedule) {
		const schedule = options.schedule
		for (const [queryKey, previous] of client.getQueriesData<FetchPlansResponse>({
			queryKey: listKey,
		})) {
			if (!previous) continue
			const request = queryKey[3] as { from?: string; to?: string } | undefined
			client.setQueryData<FetchPlansResponse>(queryKey, {
				...previous,
				data: previous.data.flatMap((plan) => {
					if (plan.id === options.removeId) return []
					if (!schedule || plan.id !== schedule.planId) return [plan]
					const next = {
						...plan,
						startsAt: schedule.startsAt ?? plan.startsAt,
						endsAt: schedule.endsAt ?? plan.endsAt,
					}
					if (
						request?.from &&
						request.to &&
						!overlaps(next.startsAt, next.endsAt, request.from, request.to)
					)
						return []
					return [next]
				}),
			})
		}
	}
	await client.invalidateQueries({ queryKey: listKey, refetchType: 'none' })
	if (current())
		void client.refetchQueries({ queryKey: listKey, type: 'active' }, { throwOnError: false })
}
