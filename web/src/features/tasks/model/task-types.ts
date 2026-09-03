export type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'DONE'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Task {
	id: string
	title: string
	description?: string
	status: TaskStatus
	priority: TaskPriority
	/** Optional planned start. When absent, the task is treated as starting when it was created. */
	startDate?: Date
	dueDate?: Date
	createdAt: Date
	updatedAt: Date
}
