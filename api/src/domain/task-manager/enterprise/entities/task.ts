import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface TaskProps {
	userId: UniqueEntityID
	title: string
	description?: string | null
	status: TaskStatus
	priority: TaskPriority
	startDate?: Date | null
	dueDate?: Date | null
	createdAt: Date
	updatedAt?: Date | null
}

export class Task extends Entity<TaskProps> {
	static create(
		props: Optional<TaskProps, 'createdAt' | 'status' | 'priority'>,
		id?: UniqueEntityID,
	) {
		const task = new Task(
			{
				...props,
				description: props.description ?? null,
				status: props.status ?? 'BACKLOG',
				priority: props.priority ?? 'LOW',
				startDate: props.startDate ?? null,
				dueDate: props.dueDate ?? null,
				createdAt: props.createdAt ?? new Date(),
				updatedAt: props.updatedAt ?? null,
			},
			id,
		)

		return task
	}

	get userId() {
		return this.props.userId
	}

	get title() {
		return this.props.title
	}

	get description() {
		return this.props.description
	}

	get status() {
		return this.props.status
	}

	get priority() {
		return this.props.priority
	}

	get startDate() {
		return this.props.startDate
	}

	get dueDate() {
		return this.props.dueDate
	}

	get createdAt() {
		return this.props.createdAt
	}

	get updatedAt() {
		return this.props.updatedAt
	}

	set title(title: string) {
		this.props.title = title

		this.touch()
	}

	set description(description: string | null | undefined) {
		this.props.description = description ?? null

		this.touch()
	}

	set status(status: TaskStatus) {
		this.props.status = status

		this.touch()
	}

	set priority(priority: TaskPriority) {
		this.props.priority = priority

		this.touch()
	}

	set startDate(startDate: Date | null | undefined) {
		this.props.startDate = startDate ?? null

		this.touch()
	}

	set dueDate(dueDate: Date | null | undefined) {
		this.props.dueDate = dueDate ?? null

		this.touch()
	}

	private touch() {
		this.props.updatedAt = new Date()
	}
}
