import type { PaginationMeta, TaskDto, TaskReadOptions, TaskSortBy } from '@/features/tasks/model/task-api-types'
import { taskListRequestSchema } from '@/features/tasks/model/task-schema'
import type { TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'
import { api } from '@/lib/ky'

export type FetchTasksRequest = {
	search?: string
	status?: TaskStatus | TaskStatus[]
	priority?: TaskPriority | TaskPriority[]
} & ({ page: number; limit: number } | { page?: never; limit?: never })
	& ({ sortBy: TaskSortBy; sortDir: 'asc' | 'desc' } | { sortBy?: never; sortDir?: never })
export interface FetchTasksResponse { data: TaskDto[]; meta?: PaginationMeta }

export async function fetchTasks(request: FetchTasksRequest = {}, { signal }: TaskReadOptions = {}): Promise<FetchTasksResponse> {
	const values = taskListRequestSchema.parse(request)
	const searchParams = new URLSearchParams()
	for (const [key, value] of Object.entries(values)) {
		if (value === undefined) continue
		for (const item of Array.isArray(value) ? value : [value]) searchParams.append(key, String(item))
	}
	const response = await api.get('api/tasks', { searchParams, signal, retry: 0 }).json<FetchTasksResponse>()
	if (request.page !== undefined && !response.meta) throw new Error('Missing Task pagination metadata')
	return response
}
