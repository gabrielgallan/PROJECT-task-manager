import type {
	IsoDateTime,
	WorkLogDto,
	WorkLogReadOptions,
} from '@/features/work-logs/model/work-log-api-types'
import { api } from '@/lib/ky'

export interface FetchWorkLogsRequest {
	from: IsoDateTime
	to: IsoDateTime
	taskId?: string[]
	categoryId?: string[]
	withoutTask?: true
	withoutCategory?: true
}

export interface FetchWorkLogsResponse {
	data: WorkLogDto[]
}

export async function fetchWorkLogs(
	request: FetchWorkLogsRequest,
	{ signal }: WorkLogReadOptions = {},
): Promise<FetchWorkLogsResponse> {
	const searchParams = new URLSearchParams()
	searchParams.set('from', request.from)
	searchParams.set('to', request.to)
	for (const id of request.taskId ?? []) searchParams.append('taskId', id)
	for (const id of request.categoryId ?? []) searchParams.append('categoryId', id)
	if (request.withoutTask) searchParams.set('withoutTask', 'true')
	if (request.withoutCategory) searchParams.set('withoutCategory', 'true')

	return api.get('api/work-logs', { searchParams, signal, retry: 0 }).json<FetchWorkLogsResponse>()
}
