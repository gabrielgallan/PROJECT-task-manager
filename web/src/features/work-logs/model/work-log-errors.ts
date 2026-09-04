import { getHttpStatus } from '@/features/identity/model/identity-errors'

export type WorkLogOperation = 'list' | 'create' | 'edit' | 'delete' | 'schedule'

export function getWorkLogError(error: unknown, operation: WorkLogOperation): string {
	const status = getHttpStatus(error)
	if (status === undefined) return 'Unable to connect. Check your connection and try again.'
	if (status >= 500) return 'The service is unavailable. Please try again.'
	if (status === 401) return 'Your session could not be verified. Please try again.'
	if (status === 400) {
		if (operation === 'list') return 'The selected range or filters are invalid.'
		if (operation === 'schedule')
			return 'This work log could not be moved to that time. It may conflict with recorded work.'
		return 'The work log could not be saved. Check its time and selected links.'
	}
	if (status === 404) {
		if (operation === 'create') return 'The selected task or category is no longer available.'
		if (operation === 'edit')
			return 'This work log or one of its selected links is no longer available.'
		return 'This work log is no longer available. Refresh the calendar.'
	}
	return 'Something went wrong. Please try again.'
}

export class WorkLogActionBlockedError extends Error {}
