import type { DateOnly, TaskDto } from '@/features/tasks/model/task-api-types'
import type { TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'
import { api } from '@/lib/ky'

export interface CreateTaskRequest {
	title: string
	description?: string
	status?: TaskStatus
	priority?: TaskPriority
	startDate?: DateOnly
	dueDate?: DateOnly
}
export interface CreateTaskResponse { data: TaskDto }
export async function createTask(body: CreateTaskRequest): Promise<CreateTaskResponse> {
	return api.post('api/tasks', { json: body, retry: 0 }).json<CreateTaskResponse>()
}
