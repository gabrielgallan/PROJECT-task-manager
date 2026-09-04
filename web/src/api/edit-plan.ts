import type { IsoDateTime, PlanIdRequest } from '@/features/plans/model/plan-api-types'
import { api } from '@/lib/ky'

export interface EditPlanRequest extends PlanIdRequest {
	title?: string
	description?: string | null
	startsAt?: IsoDateTime
	endsAt?: IsoDateTime
	taskId?: string | null
	categoryId?: string | null
}
export async function editPlan({ planId, ...body }: EditPlanRequest): Promise<void> {
	await api.patch(`api/plans/${encodeURIComponent(planId)}`, { json: body, retry: 0 })
}
