import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'
import { normalizeDisplayText } from '@/core/utils/text'

export const CATEGORY_COLORS = [
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink',
	'rose',
	'slate',
] as const

export type CategoryColor = (typeof CATEGORY_COLORS)[number]

export function isCategoryColor(color: string): color is CategoryColor {
	return CATEGORY_COLORS.includes(color as CategoryColor)
}

export interface CategoryProps {
	userId: UniqueEntityID
	name: string
	color: CategoryColor
	createdAt: Date
	updatedAt?: Date | null
}

export class Category extends Entity<CategoryProps> {
	static create(props: Optional<CategoryProps, 'createdAt'>, id?: UniqueEntityID) {
		const category = new Category(
			{
				...props,
				name: normalizeDisplayText(props.name),
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
		this.props.name = normalizeDisplayText(name)

		this.touch()
	}

	set color(color: CategoryColor) {
		this.props.color = color

		this.touch()
	}

	private touch() {
		this.props.updatedAt = new Date()
	}
}
