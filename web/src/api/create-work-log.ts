import type { CreatedWorkLogDto, IsoDateTime } from '@/features/work-logs/model/work-log-api-types'
import { api } from '@/lib/ky'

export interface CreateWorkLogRequest {
	taskId?: string
	categoryId?: string
	title: string
	description?: string
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	timeZone: string
}

export interface CreateWorkLogResponse {
	data: CreatedWorkLogDto
}

export async function createWorkLog(body: CreateWorkLogRequest): Promise<CreateWorkLogResponse> {
	return api.post('api/work-logs', { json: body, retry: 0 }).json<CreateWorkLogResponse>()
}
