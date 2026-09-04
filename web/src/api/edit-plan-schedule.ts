import type { IsoDateTime, PlanIdRequest } from '@/features/plans/model/plan-api-types'
import { api } from '@/lib/ky'

export interface EditPlanScheduleRequest extends PlanIdRequest {
	startsAt?: IsoDateTime
	endsAt?: IsoDateTime
}
export async function editPlanSchedule({
	planId,
	...body
}: EditPlanScheduleRequest): Promise<void> {
	await api.patch(`api/plans/${encodeURIComponent(planId)}/schedule`, { json: body, retry: 0 })
}
