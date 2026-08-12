import type { Task } from '../../enterprise/entities/task'

export interface TasksRepository {
	create(task: Task): Promise<void>
}
