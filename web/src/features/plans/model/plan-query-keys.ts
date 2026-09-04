import type { FetchPlansRequest } from '@/api/fetch-plans'

export type PlanMutationOperation = 'create' | 'edit' | 'delete' | 'schedule' | 'confirm'
export type NormalizedFetchPlansRequest = FetchPlansRequest

function unique(values?: string[]): string[] | undefined {
	const result = [...new Set(values)].sort()
	return result.length ? result : undefined
}

export function normalizePlanRequest(request: FetchPlansRequest): NormalizedFetchPlansRequest {
	const taskId = unique(request.taskId)
	const categoryId = unique(request.categoryId)
	return {
		from: request.from,
		to: request.to,
		...(taskId ? { taskId } : {}),
		...(categoryId ? { categoryId } : {}),
		...(request.withoutTask ? { withoutTask: true } : {}),
		...(request.withoutCategory ? { withoutCategory: true } : {}),
	}
}

export const planKeys = {
	all: ['plans'] as const,
	lists: (generation: number) => ['plans', generation, 'list'] as const,
	list: (generation: number, request: FetchPlansRequest) =>
		['plans', generation, 'list', normalizePlanRequest(request)] as const,
	mutation: (generation: number, operation: PlanMutationOperation) =>
		['plans', generation, 'mutation', operation] as const,
}
