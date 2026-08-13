import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface SessionProps {
	userId: UniqueEntityID
	tokenHash: string
	ipAddress?: string | null
	userAgent?: string | null
	expiresAt: Date
	createdAt: Date
	revokedAt?: Date | null
}

export class Session extends Entity<SessionProps> {
	static create(props: Optional<SessionProps, 'createdAt'>, id?: UniqueEntityID) {
		const session = new Session(
			{
				...props,
				ipAddress: props.ipAddress ?? null,
				userAgent: props.userAgent ?? null,
				createdAt: props.createdAt ?? new Date(),
				revokedAt: props.revokedAt ?? null,
			},
			id,
		)

		return session
	}

	get userId() {
		return this.props.userId
	}

	get tokenHash() {
		return this.props.tokenHash
	}

	get ipAddress() {
		return this.props.ipAddress
	}

	get userAgent() {
		return this.props.userAgent
	}

	get expiresAt() {
		return this.props.expiresAt
	}

	get createdAt() {
		return this.props.createdAt
	}

	get revokedAt() {
		return this.props.revokedAt
	}

	// --

	isExpired() {
		return this.props.expiresAt <= new Date()
	}

	isRevoked() {
		return this.props.revokedAt !== null
	}

	revoke() {
		this.props.revokedAt = new Date()
	}
}
