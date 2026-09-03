import type { TaskIdRequest } from '@/features/tasks/model/task-api-types'
import type { TaskStatus } from '@/features/tasks/model/task-types'
import { api } from '@/lib/ky'

export interface EditTaskStatusRequest extends TaskIdRequest { status: TaskStatus }
export async function editTaskStatus({ taskId, status }: EditTaskStatusRequest): Promise<void> {
	await api.patch(`api/tasks/${taskId}/status`, { json: { status }, retry: 0 })
}
