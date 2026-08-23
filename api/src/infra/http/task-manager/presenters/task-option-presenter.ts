import type { TaskOption } from '@/domain/task-manager/application/repositories/tasks-repository'
import type { TaskOptionDto } from '../dtos/task-option.dto'

export class TaskOptionPresenter {
	static toHTTP(option: TaskOption): TaskOptionDto {
		return {
			id: option.id.toString(),
			title: option.title,
		}
	}
}
