import { makeSession } from 'test/unit/factories/make-session'
import { InMemorySessionsRepository } from 'test/unit/repositories/in-memory-sessions-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { RevokeSessionUseCase } from './revoke-session'

let sessionsRepository: InMemorySessionsRepository

let sut: RevokeSessionUseCase

describe('Revoke session [USE CASE]', () => {
	beforeEach(() => {
		sessionsRepository = new InMemorySessionsRepository()

		sut = new RevokeSessionUseCase(sessionsRepository)
	})

	it('should be able to revoke a session', async () => {
		await sessionsRepository.create(
			await makeSession(
				{
					userId: new UniqueEntityID('user-1'),
					ipAddress: '192.168.0.1',
					userAgent: 'node-test',
				},
				new UniqueEntityID('session-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			sessionId: 'session-1',
		})

		expect(sessionsRepository.items[0].revokedAt).toEqual(expect.any(Date))
	})

	it('should not be able to revoke a session of another user', async () => {
		await sessionsRepository.create(
			await makeSession(
				{
					userId: new UniqueEntityID('user-2'),
					ipAddress: '192.168.0.1',
					userAgent: 'node-test',
				},
				new UniqueEntityID('session-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-1',
			sessionId: 'session-1',
		})

		expect(result.value).instanceOf(NotAllowedError)
	})
})
