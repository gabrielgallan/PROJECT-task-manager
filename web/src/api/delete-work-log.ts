import type { WorkLogIdRequest } from '@/features/work-logs/model/work-log-api-types'
import { workLogIdSchema } from '@/features/work-logs/model/work-log-schema'
import { api } from '@/lib/ky'

export type DeleteWorkLogRequest = WorkLogIdRequest

export async function deleteWorkLog({ workLogId }: DeleteWorkLogRequest): Promise<void> {
	const id = workLogIdSchema.parse(workLogId)
	await api.delete(`api/work-logs/${encodeURIComponent(id)}`, { retry: 0 })
}
