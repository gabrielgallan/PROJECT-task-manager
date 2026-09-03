import { api } from '@/lib/ky'

export interface GetCategoryDeletionImpactRequest {
	categoryId: string
}

export interface GetCategoryDeletionImpactResponse {
	data: {
		plansCount: number
		workLogsCount: number
	}
}

export interface GetCategoryDeletionImpactOptions {
	signal?: AbortSignal
}

export async function getCategoryDeletionImpact(
	{ categoryId }: GetCategoryDeletionImpactRequest,
	{ signal }: GetCategoryDeletionImpactOptions = {},
): Promise<GetCategoryDeletionImpactResponse> {
	return await api
		.get(`api/categories/${categoryId}/deletion-impact`, { signal, retry: 0 })
		.json<GetCategoryDeletionImpactResponse>()
}
