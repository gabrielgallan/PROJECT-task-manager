import type { FetchTasksRequest } from '@/api/fetch-tasks'
import { TASK_PRIORITIES } from './task-priority'
import { TASK_STATUSES } from './task-status'

export type TaskMutationOperation = 'create' | 'edit' | 'delete' | 'schedule' | 'status'
export function normalizeTaskRequest(params: FetchTasksRequest): FetchTasksRequest {
	const status = TASK_STATUSES.filter((value) => params.status?.includes(value))
	const priority = TASK_PRIORITIES.filter((value) => params.priority?.includes(value))
	return { ...params, search: params.search?.trim() || undefined,
		status: status.length ? status : undefined, priority: priority.length ? priority : undefined }
}
export const taskKeys = {
	all: ['tasks'] as const,
	lists: (generation: number) => ['tasks', generation, 'list'] as const,
	list: (generation: number, params: FetchTasksRequest) => ['tasks', generation, 'list', normalizeTaskRequest(params)] as const,
	details: (generation: number, taskId: string) => ['tasks', generation, 'details', taskId] as const,
	options: (generation: number) => ['tasks', generation, 'options'] as const,
	optionSearch: (generation: number, q: string, limit: number) => ['tasks', generation, 'options', { q, limit }] as const,
	mutation: (generation: number, operation: TaskMutationOperation) => ['tasks', generation, 'mutation', operation] as const,
}
