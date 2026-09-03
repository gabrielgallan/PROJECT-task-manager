import type { DateOnly, TaskIdRequest } from '@/features/tasks/model/task-api-types'
import { api } from '@/lib/ky'

export interface EditTaskScheduleRequest extends TaskIdRequest { startDate?: DateOnly | null; dueDate?: DateOnly | null }
export async function editTaskSchedule({ taskId, ...body }: EditTaskScheduleRequest): Promise<void> {
	await api.patch(`api/tasks/${taskId}/schedule`, { json: body, retry: 0 })
}
