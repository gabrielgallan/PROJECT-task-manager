import type { DateOnly, TaskIdRequest } from '@/features/tasks/model/task-api-types'
import type { TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'
import { api } from '@/lib/ky'

export interface EditTaskRequest extends TaskIdRequest {
	title?: string
	description?: string | null
	status?: TaskStatus
	priority?: TaskPriority
	startDate?: DateOnly | null
	dueDate?: DateOnly | null
}
export async function editTask({ taskId, ...body }: EditTaskRequest): Promise<void> {
	await api.patch(`api/tasks/${taskId}`, { json: body, retry: 0 })
}
