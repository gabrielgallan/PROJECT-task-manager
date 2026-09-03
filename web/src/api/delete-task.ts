import type { TaskIdRequest } from '@/features/tasks/model/task-api-types'
import { api } from '@/lib/ky'

export type DeleteTaskRequest = TaskIdRequest
export async function deleteTask({ taskId }: DeleteTaskRequest): Promise<void> {
	await api.delete(`api/tasks/${taskId}`, { retry: 0 })
}
