import type { Task } from '../../enterprise/entities/task'

export abstract class TasksRepository {
	abstract create(task: Task): Promise<void>
}
