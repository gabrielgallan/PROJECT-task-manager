import { getHttpStatus } from '@/features/identity/model/identity-errors'

export type CategoryApiErrorBody =
	| { statusCode: number; message: string; error: string }
	| {
			message: 'Data validation failed'
			errors: { formErrors: string[]; fieldErrors: Record<string, string[] | undefined> }
	  }

type CategoryOperation = 'list' | 'create' | 'edit' | 'delete' | 'impact'

const fallbackMessages: Record<CategoryOperation, string> = {
	list: 'Unable to load categories. Please try again.',
	create: 'Unable to create this category. Please try again.',
	edit: 'Unable to save this category. Please try again.',
	delete: 'Unable to delete this category. Please try again.',
	impact: 'Unable to check category usage. Please try again.',
}

export function getCategoryError(error: unknown, operation: CategoryOperation): string {
	const status = getHttpStatus(error)
	if (!status) return 'Unable to connect. Check your connection and try again.'
	if (status >= 500) return 'The service is unavailable. Please try again.'
	if (status === 401) return 'Unable to verify your session. Please try again.'
	if (status === 404) return 'This category is no longer available. Refresh the list.'
	if (status === 400) {
		return operation === 'create' || operation === 'edit'
			? 'The category could not be saved. Check the name and color and try again.'
			: 'This category could not be accessed. Refresh the list and try again.'
	}
	return fallbackMessages[operation]
}
