import type { TaskOptionDto, TaskReadOptions } from '@/features/tasks/model/task-api-types'
import { taskOptionsRequestSchema } from '@/features/tasks/model/task-schema'
import { api } from '@/lib/ky'

export interface FetchTaskOptionsRequest { q?: string; limit?: number; cursor?: string }
export interface FetchTaskOptionsResponse { data: TaskOptionDto[]; meta: { nextCursor: string | null } }
export async function fetchTaskOptions(request: FetchTaskOptionsRequest = {}, { signal }: TaskReadOptions = {}): Promise<FetchTaskOptionsResponse> {
	const values = taskOptionsRequestSchema.parse(request)
	const searchParams = new URLSearchParams()
	for (const [key, value] of Object.entries(values)) {
		if (value !== undefined) searchParams.set(key, String(value))
	}
	return api.get('api/tasks/options', { searchParams, signal, retry: 0 }).json<FetchTaskOptionsResponse>()
}
