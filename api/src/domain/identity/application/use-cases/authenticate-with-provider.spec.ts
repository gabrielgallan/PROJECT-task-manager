import { AuthProviderStub } from 'test/stubs/auth-provider'
import { SessionTokenGeneratorStub } from 'test/stubs/session-token-generator'
import { SessionTokenHasherStub } from 'test/stubs/session-token-hasher'
import { InMemoryAccountsRepository } from 'test/unit/repositories/in-memory-accounts-repository'
import { InMemorySessionsRepository } from 'test/unit/repositories/in-memory-sessions-repository'
import { InMemoryUsersRepository } from 'test/unit/repositories/in-memory-users-repository'
import type { AuthProvider } from '../auth/auth-provider'
import { SessionTokenGenerator } from '../cryptography/session-token-generator'
import { SessionTokenHasher } from '../cryptography/session-token-hasher'
import { AuthenticateWithProviderUseCase } from './authenticate-with-provider'

let usersRepository: InMemoryUsersRepository
let accountsRepository: InMemoryAccountsRepository
let sessionsRepository: InMemorySessionsRepository
let authProvider: AuthProvider
let sessionTokenGenerator: SessionTokenGenerator
let sessionTokenHasher: SessionTokenHasher

let sut: AuthenticateWithProviderUseCase

describe('Authenticate with  provider [USE CASE]', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository()
		accountsRepository = new InMemoryAccountsRepository()
		sessionsRepository = new InMemorySessionsRepository()
		authProvider = new AuthProviderStub()
		sessionTokenGenerator = new SessionTokenGeneratorStub()
		sessionTokenHasher = new SessionTokenHasherStub()

		sut = new AuthenticateWithProviderUseCase(
			usersRepository,
			accountsRepository,
			sessionsRepository,
			authProvider,
			sessionTokenGenerator,
			sessionTokenHasher,
		)
	})

	it('should be able to authenticate with provider', async () => {
		await sut.execute({
			provider: 'GITHUB',
			code: 'fake-provider-code',
			ipAddress: '127.0.0.1',
			userAgent: 'UseCase',
		})

		expect(accountsRepository.items[0].providerUserId).toBe('-user-id')

		expect(usersRepository.items[0].email).toBe('johndoe@example.com')
		expect(usersRepository.items[0].name).toBe('John Doe')
		expect(usersRepository.items[0].avatarUrl).toBe('https://example.com/avatar.jpg')

		expect(sessionsRepository.items).toHaveLength(1)
		expect(sessionsRepository.items[0].userId.equals(usersRepository.items[0].id)).toBe(true)
		expect(sessionsRepository.items[0].ipAddress).toBe('127.0.0.1')
		expect(sessionsRepository.items[0].userAgent).toBe('UseCase')
	})
})
