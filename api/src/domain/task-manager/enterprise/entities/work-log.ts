import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface WorkLogProps {
	userId: UniqueEntityID
	taskId?: UniqueEntityID | null
	categoryId?: UniqueEntityID | null
	title: string
	description?: string | null
	startsAt: Date
	endsAt: Date
	createdAt: Date
	updatedAt?: Date | null
}

export class WorkLog extends Entity<WorkLogProps> {
	static create(props: Optional<WorkLogProps, 'createdAt'>, id?: UniqueEntityID) {
		const workLog = new WorkLog(
			{
				...props,
				taskId: props.taskId ?? null,
				categoryId: props.categoryId ?? null,
				description: props.description ?? null,
				createdAt: props.createdAt ?? new Date(),
				updatedAt: props.updatedAt ?? null,
			},
			id,
		)

		return workLog
	}

	get userId() {
		return this.props.userId
	}

	get taskId() {
		return this.props.taskId
	}

	get categoryId() {
		return this.props.categoryId
	}

	get title() {
		return this.props.title
	}

	get description() {
		return this.props.description
	}

	get startsAt() {
		return this.props.startsAt
	}

	get endsAt() {
		return this.props.endsAt
	}

	get createdAt() {
		return this.props.createdAt
	}

	get updatedAt() {
		return this.props.updatedAt
	}

	set taskId(taskId: UniqueEntityID | null | undefined) {
		this.props.taskId = taskId ?? null

		this.touch()
	}

	set categoryId(categoryId: UniqueEntityID | null | undefined) {
		this.props.categoryId = categoryId ?? null

		this.touch()
	}

	set title(title: string) {
		this.props.title = title

		this.touch()
	}

	set description(description: string | null | undefined) {
		this.props.description = description ?? null

		this.touch()
	}

	set startsAt(startsAt: Date) {
		this.props.startsAt = startsAt

		this.touch()
	}

	set endsAt(endsAt: Date) {
		this.props.endsAt = endsAt

		this.touch()
	}

	private touch() {
		this.props.updatedAt = new Date()
	}
}
