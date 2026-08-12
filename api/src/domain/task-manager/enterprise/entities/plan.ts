import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

export interface PlanProps {
	userId: UniqueEntityID
	taskId?: UniqueEntityID | null
	title: string
	description?: string | null
	startDate: Date
	endDate: Date
	confirmedAt?: Date | null
}

export class Plan extends Entity<PlanProps> {
	static create(props: PlanProps, id?: UniqueEntityID) {
		const plan = new Plan(
			{
				...props,
				taskId: props.taskId ?? null,
				description: props.description ?? null,
				confirmedAt: props.confirmedAt ?? null,
			},
			id,
		)

		return plan
	}
}
