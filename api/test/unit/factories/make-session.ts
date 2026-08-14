import { randomBytes } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { addDays } from 'date-fns'
import { SessionTokenHasherStub } from 'test/stubs/session-token-hasher'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Session, type SessionProps } from '@/domain/identity/enterprise/entities/session'

const sessionTokenHasher = new SessionTokenHasherStub()

export async function makeSession(override: Partial<SessionProps> = {}, id?: UniqueEntityID) {
	const session = Session.create(
		{
			userId: new UniqueEntityID(),
			tokenHash: sessionTokenHasher.hash(randomBytes(32).toString('base64url')),
			expiresAt: addDays(new Date(), 30),
			ipAddress: faker.internet.ipv4(),
			userAgent: faker.internet.userAgent(),
			...override,
		},
		id,
	)

	return session
}
