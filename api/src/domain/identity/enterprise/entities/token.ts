import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export type TokenType = 'PASSWORD_RECOVER'

export interface TokenProps {
	userId: UniqueEntityID
	type: TokenType
	usedAt?: Date | null
	expiresAt: Date
	createdAt: Date
}

export class Token extends Entity<TokenProps> {
	static create(props: Optional<TokenProps, 'createdAt' | 'expiresAt'>, id?: UniqueEntityID) {
		const token = new Token(
			{
				...props,
				usedAt: props.usedAt ?? null,
				createdAt: props.createdAt ?? new Date(),
				expiresAt: props.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 1), // 1 hour from now
			},
			id,
		)

		return token
	}

	get userId() {
		return this.props.userId
	}

	get type() {
		return this.props.type
	}

	get usedAt() {
		return this.props.usedAt
	}

	get expiresAt() {
		return this.props.expiresAt
	}

	get createdAt() {
		return this.props.createdAt
	}

	use() {
		this.props.usedAt = new Date()
	}

	isExpired() {
		return this.props.expiresAt < new Date()
	}

	isUsed() {
		return this.props.usedAt !== null && this.props.usedAt !== undefined
	}
}
