import type { FetchWorkLogsRequest } from '@/api/fetch-work-logs'

export type WorkLogMutationOperation = 'create' | 'edit' | 'delete' | 'schedule'
export type NormalizedFetchWorkLogsRequest = FetchWorkLogsRequest

function unique(values?: string[]): string[] | undefined {
	const result = [...new Set(values)].sort()
	return result.length ? result : undefined
}

export function normalizeWorkLogRequest(
	request: FetchWorkLogsRequest,
): NormalizedFetchWorkLogsRequest {
	const taskId = unique(request.taskId)
	const categoryId = unique(request.categoryId)
	return {
		from: request.from,
		to: request.to,
		...(taskId ? { taskId } : {}),
		...(categoryId ? { categoryId } : {}),
		...(request.withoutTask ? { withoutTask: true as const } : {}),
		...(request.withoutCategory ? { withoutCategory: true as const } : {}),
	}
}

export const workLogKeys = {
	all: ['work-logs'] as const,
	lists: (generation: number) => ['work-logs', generation, 'list'] as const,
	list: (generation: number, request: FetchWorkLogsRequest) =>
		['work-logs', generation, 'list', normalizeWorkLogRequest(request)] as const,
	mutation: (generation: number, operation: WorkLogMutationOperation) =>
		['work-logs', generation, 'mutation', operation] as const,
}
