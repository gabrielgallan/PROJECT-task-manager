import { InMemoryAccountsRepository } from 'test/unit/repositories/in-memory-accounts-repository'
import { InMemoryTokensRepository } from 'test/unit/repositories/in-memory-tokens-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { HasherStub } from '../../../../../test/stubs/hasher'
import { SessionTokenGeneratorStub } from '../../../../../test/stubs/session-token-generator'
import { SessionTokenHasherStub } from '../../../../../test/stubs/session-token-hasher'
import { InMemorySessionsRepository } from '../../../../../test/unit/repositories/in-memory-sessions-repository'
import { InMemoryUsersRepository } from '../../../../../test/unit/repositories/in-memory-users-repository'
import { User } from '../../enterprise/entities/user'
import { Hasher } from '../cryptography/hasher'
import { SessionTokenGenerator } from '../cryptography/session-token-generator'
import { SessionTokenHasher } from '../cryptography/session-token-hasher'
import { AuthenticateUseCase } from './authenticate'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'

let usersRepository: InMemoryUsersRepository
let sessionsRepository: InMemorySessionsRepository
let hasher: Hasher
let sessionTokenGenerator: SessionTokenGenerator
let sessionTokenHasher: SessionTokenHasher

let sut: AuthenticateUseCase

describe('Authenticate user [USE CASE]', () => {
	beforeEach(() => {
		sessionsRepository = new InMemorySessionsRepository()
		usersRepository = new InMemoryUsersRepository(
			sessionsRepository,
			new InMemoryAccountsRepository(),
			new InMemoryTokensRepository(),
		)
		hasher = new HasherStub()
		sessionTokenGenerator = new SessionTokenGeneratorStub()
		sessionTokenHasher = new SessionTokenHasherStub()

		sut = new AuthenticateUseCase(
			usersRepository,
			sessionsRepository,
			hasher,
			sessionTokenGenerator,
			sessionTokenHasher,
		)
	})

	it('should be able to authenticate with credentials', async () => {
		await usersRepository.create(
			User.create(
				{
					email: 'johndoe@email.com',
					passwordHash: await hasher.generate('JohnDoe123'),
				},
				new UniqueEntityID('user-1'),
			),
		)

		const result = await sut.execute({
			email: 'johndoe@email.com',
			password: 'JohnDoe123',
		})

		expect(result.isRight())

		if (result.isRight()) {
			expectTypeOf(result.value.token).toBeString()
			expect(sessionsRepository.items).toHaveLength(1)
			expect(sessionsRepository.items[0].userId.toString()).toBe('user-1')
			expect(sessionsRepository.items[0].tokenHash).toBe(
				sessionTokenHasher.hash(result.value.token),
			)
		}
	})

	it('should not be able to authenticate with invalid password', async () => {
		await usersRepository.create(
			User.create(
				{
					email: 'johndoe@email.com',
					passwordHash: await hasher.generate('JohnDoe123'),
				},
				new UniqueEntityID('user-1'),
			),
		)

		const result = await sut.execute({
			email: 'johndoe@email.com',
			password: 'incorrectPassword',
		})

		expect(result.isLeft())
		expect(result.value).instanceOf(InvalidCredentialsError)
	})
})
