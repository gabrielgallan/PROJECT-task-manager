import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

export type AccountProvider = 'GITHUB' | 'GOOGLE'

interface AccountProps {
	userId: UniqueEntityID
	provider: AccountProvider
	providerUserId?: string | null
}

export class Account extends Entity<AccountProps> {
	static create(props: AccountProps, id?: UniqueEntityID) {
		const account = new Account(
			{
				...props,
				providerUserId: props.providerUserId ?? null,
			},
			id,
		)

		return account
	}

	get userId() {
		return this.props.userId
	}

	get provider() {
		return this.props.provider
	}

	get providerUserId() {
		return this.props.providerUserId
	}
}
