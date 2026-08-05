import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

type TaskStatus = 'backlog' | 'in_process' | 'done'

export interface TaskProps {
	title: string
	status: TaskStatus
	createdAt: Date
	updatedAt?: Date | null
}

export class Task extends Entity<TaskProps> {
	static create(props: Optional<TaskProps, 'createdAt'>, id?: UniqueEntityID) {
		const task = new Task(
			{
				...props,
			},
			id,
		)

		return task
	}
}
