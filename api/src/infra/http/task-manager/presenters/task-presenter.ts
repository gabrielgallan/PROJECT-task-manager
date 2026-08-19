import { Task } from '@/domain/task-manager/enterprise/entities/task'
import { TaskDto } from '../dtos/task.dto'

export class TaskPresenter {
	static toHTTP(task: Task): TaskDto {
		return {
			title: task.title,
			description: task.description ?? null,
			status: task.status,
			priority: task.priority,
			startDate: task.startDate ?? null,
			dueDate: task.dueDate ?? null,
			updatedAt: task.updatedAt ?? null,
		}
	}
}
