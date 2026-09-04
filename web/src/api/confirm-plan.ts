import type { PlanIdRequest } from '@/features/plans/model/plan-api-types'
import { api } from '@/lib/ky'

export interface ConfirmPlanRequest extends PlanIdRequest {
	timeZone: string
}
export async function confirmPlan({ planId, timeZone }: ConfirmPlanRequest): Promise<void> {
	await api.post(`api/plans/${encodeURIComponent(planId)}/record-as-done`, {
		json: { timeZone },
		retry: 0,
	})
}
