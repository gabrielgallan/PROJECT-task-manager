import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

export interface WorkLogProps {
	userId: UniqueEntityID
	taskId?: UniqueEntityID | null
	title: string
	description?: string | null
	startDate: Date
	endDate: Date
}

export class WorkLog extends Entity<WorkLogProps> {
	static create(props: WorkLogProps, id?: UniqueEntityID) {
		const workLog = new WorkLog(
			{
				...props,
				taskId: props.taskId ?? null,
				description: props.description ?? null,
			},
			id,
		)

		return workLog
	}
}
