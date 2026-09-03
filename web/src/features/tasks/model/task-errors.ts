import { getHttpStatus } from '@/features/identity/model/identity-errors'

export type TaskApiErrorBody =
	| { statusCode: number; message: string; error: unknown }
	| { message: 'Data validation failed'; errors: { formErrors: string[]; fieldErrors: Record<string, string[] | undefined> } }
export type TaskOperation = 'list' | 'details' | 'options' | 'create' | 'edit' | 'delete' | 'status' | 'schedule'
export class TaskActionBlockedError extends Error {}
const messages: Record<TaskOperation, string> = {
	list: 'Unable to load tasks. Please try again.',
	details: 'Unable to load task details. Please try again.',
	options: 'Unable to load task options. Restart the search and try again.',
	create: 'Unable to create this task. Please try again.',
	edit: 'Unable to save this task. Please try again.',
	delete: 'Unable to delete this task. Please try again.',
	status: 'Unable to change this task’s status. Please try again.',
	schedule: 'Unable to change this task’s dates. Please try again.',
}
export function getTaskError(error: unknown, operation: TaskOperation): string {
	const status = getHttpStatus(error)
	if (!status) return 'Unable to connect. Check your connection and try again.'
	if (status >= 500) return 'The service is unavailable. Please try again.'
	if (status === 401) return 'Unable to verify your session. Please try again.'
	if (status === 404) return 'This task is no longer available. Refresh the list.'
	if (status === 400) {
		if (operation === 'create' || operation === 'edit') return 'The task could not be saved. Check the fields and try again.'
		if (operation === 'list') return 'Unable to load tasks with these filters. Reset the filters and try again.'
		if (operation === 'details' || operation === 'delete') return 'This task could not be accessed. Refresh the list and try again.'
	}
	return messages[operation]
}
