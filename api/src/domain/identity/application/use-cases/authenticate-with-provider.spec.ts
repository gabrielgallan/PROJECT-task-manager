import { AuthProviderStub } from 'test/stubs/auth-provider'
import { AuthProviderRegistryStub } from 'test/stubs/auth-provider-registry'
import { SessionTokenGeneratorStub } from 'test/stubs/session-token-generator'
import { SessionTokenHasherStub } from 'test/stubs/session-token-hasher'
import { InMemoryAccountsRepository } from 'test/unit/repositories/in-memory-accounts-repository'
import { InMemorySessionsRepository } from 'test/unit/repositories/in-memory-sessions-repository'
import { InMemoryUsersRepository } from 'test/unit/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { AccountProvider } from '../../enterprise/entities/account'
import { SessionTokenGenerator } from '../cryptography/session-token-generator'
import { SessionTokenHasher } from '../cryptography/session-token-hasher'
import { AuthenticateWithProviderUseCase } from './authenticate-with-provider'
import { UnsupportedAuthProviderError } from './errors/unsupported-auth-provider-error'

let usersRepository: InMemoryUsersRepository
let accountsRepository: InMemoryAccountsRepository
let sessionsRepository: InMemorySessionsRepository
let authProviders: AuthProviderRegistryStub
let sessionTokenGenerator: SessionTokenGenerator
let sessionTokenHasher: SessionTokenHasher

let sut: AuthenticateWithProviderUseCase

describe('Authenticate with  provider [USE CASE]', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository()
		accountsRepository = new InMemoryAccountsRepository()
		sessionsRepository = new InMemorySessionsRepository()
		authProviders = new AuthProviderRegistryStub().register(new AuthProviderStub('GITHUB'))
		sessionTokenGenerator = new SessionTokenGeneratorStub()
		sessionTokenHasher = new SessionTokenHasherStub()

		sut = new AuthenticateWithProviderUseCase(
			usersRepository,
			accountsRepository,
			sessionsRepository,
			authProviders,
			sessionTokenGenerator,
			sessionTokenHasher,
		)
	})

	it('should be able to authenticate with provider', async () => {
		await sut.execute({
			provider: 'GITHUB',
			code: 'fake-provider-code',
			ipAddress: '127.0.0.1',
		})

		expect(accountsRepository.items[0].providerUserId).toBe('-user-id')
		expect(accountsRepository.items[0].userId).instanceOf(UniqueEntityID)

		expect(usersRepository.items[0].email).toBe('johndoe@example.com')
		expect(usersRepository.items[0].name).toBe('John Doe')

		expect(sessionsRepository.items).toHaveLength(1)
		expect(sessionsRepository.items[0].userId.equals(usersRepository.items[0].id)).toBe(true)
		expect(sessionsRepository.items[0].ipAddress).toBe('127.0.0.1')
		expect(sessionsRepository.items[0].revokedAt).toBe(null)
		expect(sessionsRepository.items[0].createdAt).toEqual(expect.any(Date))
	})

	it('should not be able to authenticate with an unsupported provider', async () => {
		const result = await sut.execute({
			provider: 'UNSUPORTTED' as AccountProvider,
			code: 'fake-provider-code',
			ipAddress: '127.0.0.1',
			userAgent: 'UseCase',
		})

		expect(result.isLeft())
		expect(result.value).instanceOf(UnsupportedAuthProviderError)
	})
})
