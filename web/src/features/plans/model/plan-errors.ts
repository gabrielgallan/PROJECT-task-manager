import { getHttpStatus } from '@/features/identity/model/identity-errors'

export type PlanOperation = 'list' | 'create' | 'edit' | 'delete' | 'schedule' | 'confirm'

export function getPlanError(error: unknown, operation: PlanOperation): string {
	const status = getHttpStatus(error)
	if (status === undefined) return 'Unable to connect. Check your connection and try again.'
	if (status >= 500) return 'The service is unavailable. Please try again.'
	if (status === 400) {
		if (operation === 'list') return 'The selected range or filters are invalid.'
		if (operation === 'confirm')
			return 'This plan could not be recorded. Check its time and try again.'
		return operation === 'schedule'
			? 'This plan could not be moved to that time.'
			: 'The plan could not be saved.'
	}
	if (status === 404) {
		if (operation === 'create') return 'The selected task or category is no longer available.'
		if (operation === 'edit')
			return 'This plan or one of its selected links is no longer available.'
		return 'This plan is no longer available. Refresh the calendar.'
	}
	if (status === 409 && operation === 'confirm') return 'This plan has already been recorded.'
	return 'Something went wrong. Please try again.'
}

export class PlanActionBlockedError extends Error {}
