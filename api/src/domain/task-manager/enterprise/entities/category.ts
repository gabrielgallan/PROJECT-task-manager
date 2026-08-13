import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface CategoryProps {
	userId: UniqueEntityID
	name: string
	color: string
	createdAt: Date
	updatedAt?: Date | null
}

export class Category extends Entity<CategoryProps> {
	static create(props: Optional<CategoryProps, 'createdAt'>, id?: UniqueEntityID) {
		const category = new Category(
			{
				...props,
				createdAt: props.createdAt ?? new Date(),
				updatedAt: props.updatedAt ?? null,
			},
			id,
		)

		return category
	}

	get userId() {
		return this.props.userId
	}

	get name() {
		return this.props.name
	}

	get color() {
		return this.props.color
	}

	get createdAt() {
		return this.props.createdAt
	}

	get updatedAt() {
		return this.props.updatedAt
	}

	set name(name: string) {
		this.props.name = name

		this.touch()
	}

	set color(color: string) {
		this.props.color = color

		this.touch()
	}

	private touch() {
		this.props.updatedAt = new Date()
	}
}
