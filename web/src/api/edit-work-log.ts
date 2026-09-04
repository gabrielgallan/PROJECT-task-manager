import type { IsoDateTime, WorkLogIdRequest } from '@/features/work-logs/model/work-log-api-types'
import { workLogIdSchema } from '@/features/work-logs/model/work-log-schema'
import { api } from '@/lib/ky'

export interface EditWorkLogRequest extends WorkLogIdRequest {
	taskId?: string | null
	categoryId?: string | null
	title?: string
	description?: string | null
	startsAt?: IsoDateTime
	endsAt?: IsoDateTime
	timeZone: string
}

export async function editWorkLog({ workLogId, ...body }: EditWorkLogRequest): Promise<void> {
	const id = workLogIdSchema.parse(workLogId)
	await api.patch(`api/work-logs/${encodeURIComponent(id)}`, { json: body, retry: 0 })
}
