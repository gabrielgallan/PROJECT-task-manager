import type { IsoDateTime, PlanDto, PlanReadOptions } from '@/features/plans/model/plan-api-types'
import { api } from '@/lib/ky'

export interface FetchPlansRequest {
	from: IsoDateTime
	to: IsoDateTime
	taskId?: string[]
	categoryId?: string[]
	withoutTask?: true
	withoutCategory?: true
}
export interface FetchPlansResponse {
	data: PlanDto[]
}

export async function fetchPlans(request: FetchPlansRequest, { signal }: PlanReadOptions = {}) {
	const searchParams = new URLSearchParams()
	searchParams.set('from', request.from)
	searchParams.set('to', request.to)
	for (const id of request.taskId ?? []) searchParams.append('taskId', id)
	for (const id of request.categoryId ?? []) searchParams.append('categoryId', id)
	if (request.withoutTask) searchParams.set('withoutTask', 'true')
	if (request.withoutCategory) searchParams.set('withoutCategory', 'true')
	return api.get('api/plans', { searchParams, signal, retry: 0 }).json<FetchPlansResponse>()
}
