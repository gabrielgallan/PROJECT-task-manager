import { Entity } from "@/core/entities/entity";
import type { UniqueEntityID } from "@/core/entities/unique-entity-id";
import type { Optional } from "@/core/types/optional";

export interface TaskProps {
  registeredAt: Date;
}

export class Task extends Entity<TaskProps> {
	static create(
		props: Optional<TaskProps, "registeredAt">,
		id?: UniqueEntityID,
	) {
		const task = new Task(
			{
				...props,
				registeredAt: props.registeredAt ?? new Date(),
			},
			id,
		);

		return task;
	}
}
