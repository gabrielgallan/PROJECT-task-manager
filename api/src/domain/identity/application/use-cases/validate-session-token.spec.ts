import { SessionTokenHasherStub } from 'test/stubs/session-token-hasher'
import { makeSession } from 'test/unit/factories/make-session'
import { InMemorySessionsRepository } from 'test/unit/repositories/in-memory-sessions-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { SessionTokenHasher } from '../cryptography/session-token-hasher'
import { InvalidSessionError } from './errors/invalid-session-error'
import { ValidateSessionTokenUseCase } from './validate-session-token'

let sessionsRepository: InMemorySessionsRepository
let sessionTokenHasher: SessionTokenHasher

let sut: ValidateSessionTokenUseCase

describe('Validate session token [USE CASE]', () => {
	beforeEach(() => {
		sessionsRepository = new InMemorySessionsRepository()
		sessionTokenHasher = new SessionTokenHasherStub()

		sut = new ValidateSessionTokenUseCase(sessionsRepository, sessionTokenHasher)

		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('should be able to validate token and get userId and sessionId', async () => {
		await sessionsRepository.create(
			await makeSession(
				{
					userId: new UniqueEntityID('user-1'),
					tokenHash: sessionTokenHasher.hash('session-token'),
				},
				new UniqueEntityID('session-1'),
			),
		)

		const result = await sut.execute({
			token: 'session-token',
		})

		expect(result.isRight())

		if (result.isRight()) {
			expect(result.value.userId).toBe('user-1')
			expect(result.value.sessionId).toBe('session-1')
		}
	})

	it('should not be able to validate token of a non-existing session', async () => {
		const result = await sut.execute({
			token: 'session-token',
		})

		expect(result.isLeft())
		expect(result.value).instanceOf(ResourceNotFoundError)
	})

	it('should not be able to validate token of an expired session', async () => {
		vi.setSystemTime(new Date(2026, 5, 20))

		await sessionsRepository.create(
			await makeSession(
				{
					userId: new UniqueEntityID('user-1'),
					tokenHash: sessionTokenHasher.hash('session-token'),
				},
				new UniqueEntityID('session-1'),
			),
		)

		vi.setSystemTime(new Date(2026, 6, 25))

		const result = await sut.execute({
			token: 'session-token',
		})

		expect(result.isLeft())
		expect(result.value).instanceOf(InvalidSessionError)
	})

	it('should not be able to validate token of an revoked session', async () => {
		await sessionsRepository.create(
			await makeSession(
				{
					userId: new UniqueEntityID('user-1'),
					tokenHash: sessionTokenHasher.hash('session-token'),
					revokedAt: new Date(),
				},
				new UniqueEntityID('session-1'),
			),
		)

		const result = await sut.execute({
			token: 'session-token',
		})

		expect(result.isLeft())
		expect(result.value).instanceOf(InvalidSessionError)
	})
})
