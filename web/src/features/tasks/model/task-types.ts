export type TaskStatus = 'backlog' | 'in_progress' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
	id: string
	title: string
	status: TaskStatus
	priority: TaskPriority
	/** Optional planned start. When absent, the task is treated as starting when it was created. */
	startDate?: Date
	dueDate?: Date
	createdAt: Date
	updatedAt: Date
}
