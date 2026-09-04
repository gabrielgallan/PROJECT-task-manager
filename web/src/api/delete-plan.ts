import type { PlanIdRequest } from '@/features/plans/model/plan-api-types'
import { api } from '@/lib/ky'

export type DeletePlanRequest = PlanIdRequest
export async function deletePlan({ planId }: DeletePlanRequest): Promise<void> {
	await api.delete(`api/plans/${encodeURIComponent(planId)}`, { retry: 0 })
}
