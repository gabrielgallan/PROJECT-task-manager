import type { CreatedPlanDto, IsoDateTime } from '@/features/plans/model/plan-api-types'
import { api } from '@/lib/ky'

export interface CreatePlanRequest {
	title: string
	description?: string
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	taskId?: string
	categoryId?: string
}
export interface CreatePlanResponse {
	data: CreatedPlanDto
}
export async function createPlan(body: CreatePlanRequest): Promise<CreatePlanResponse> {
	return api.post('api/plans', { json: body, retry: 0 }).json<CreatePlanResponse>()
}
