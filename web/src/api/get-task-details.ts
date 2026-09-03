import type { TaskDetailsDto, TaskIdRequest, TaskReadOptions } from '@/features/tasks/model/task-api-types'
import { api } from '@/lib/ky'

export type GetTaskDetailsRequest = TaskIdRequest
export interface GetTaskDetailsResponse { data: TaskDetailsDto }
export async function getTaskDetails({ taskId }: GetTaskDetailsRequest, { signal }: TaskReadOptions = {}): Promise<GetTaskDetailsResponse> {
	return api.get(`api/tasks/${taskId}`, { signal, retry: 0 }).json<GetTaskDetailsResponse>()
}
