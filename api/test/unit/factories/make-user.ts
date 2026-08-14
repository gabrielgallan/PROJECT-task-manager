import { faker } from '@faker-js/faker'
import { HasherStub } from 'test/stubs/hasher'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { User, type UserProps } from '@/domain/identity/enterprise/entities/user'

const hasher = new HasherStub()

export async function makeUser(override: Partial<UserProps> = {}, id?: UniqueEntityID) {
	const user = User.create(
		{
			name: faker.person.fullName(),
			email: faker.internet.email(),
			jobTitle: faker.person.jobTitle(),
			passwordHash: await hasher.generate(
				faker.string.hexadecimal({
					length: 10,
				}),
			),
			...override,
		},
		id,
	)

	return user
}
