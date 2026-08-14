import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Token, type TokenProps } from '@/domain/identity/enterprise/entities/token'

export async function makeToken(override: Partial<TokenProps> = {}, id?: UniqueEntityID) {
	const token = Token.create(
		{
			userId: new UniqueEntityID(),
			type: 'PASSWORD_RECOVER',
			...override,
		},
		id,
	)

	return token
}
