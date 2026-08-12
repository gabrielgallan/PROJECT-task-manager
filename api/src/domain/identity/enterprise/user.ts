import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface UserProps {
	name?: string | null
	email: string
	avatarUrl?: string | null
	passwordHash?: string | null
	createdAt: Date
	updatedAt?: Date | null
}

export class User extends Entity<UserProps> {
	static create(props: Optional<UserProps, 'createdAt'>, id?: UniqueEntityID) {
		const user = new User(
			{
				...props,
				name: props.name ?? null,
				passwordHash: props.passwordHash ?? null,
				avatarUrl: props.avatarUrl ?? null,
				createdAt: props.createdAt ?? new Date(),
				updatedAt: props.updatedAt ?? null,
			},
			id,
		)

		return user
	}

	// Getters
	get name() {
		return this.props.name
	}

	get email() {
		return this.props.email
	}

	get passwordHash() {
		return this.props.passwordHash
	}

	get avatarUrl() {
		return this.props.avatarUrl
	}

	get createdAt() {
		return this.props.createdAt
	}

	get updatedAt() {
		return this.props.updatedAt
	}

	// Setters
	set avatarUrl(url: string | null | undefined) {
		this.props.avatarUrl = url

		this.touch()
	}

	set passwordHash(passwordHash: string | null | undefined) {
		this.props.passwordHash = passwordHash

		this.touch()
	}

	// Methods
	touch() {
		this.props.updatedAt = new Date()
	}
}
