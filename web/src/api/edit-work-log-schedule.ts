import type { IsoDateTime, WorkLogIdRequest } from '@/features/work-logs/model/work-log-api-types'
import { workLogIdSchema } from '@/features/work-logs/model/work-log-schema'
import { api } from '@/lib/ky'

export interface EditWorkLogScheduleRequest extends WorkLogIdRequest {
	startsAt?: IsoDateTime
	endsAt?: IsoDateTime
	timeZone: string
}

export async function editWorkLogSchedule({
	workLogId,
	...body
}: EditWorkLogScheduleRequest): Promise<void> {
	const id = workLogIdSchema.parse(workLogId)
	await api.patch(`api/work-logs/${encodeURIComponent(id)}/schedule`, {
		json: body,
		retry: 0,
	})
}
