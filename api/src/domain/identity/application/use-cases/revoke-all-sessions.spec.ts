import { makeSession } from 'test/unit/factories/make-session'
import { InMemorySessionsRepository } from 'test/unit/repositories/in-memory-sessions-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RevokeAllSessionsUseCase } from './revoke-all-sessions'

let sessionsRepository: InMemorySessionsRepository

let sut: RevokeAllSessionsUseCase

describe('Revoke all user sessions [USE CASE]', () => {
	beforeEach(() => {
		sessionsRepository = new InMemorySessionsRepository()

		sut = new RevokeAllSessionsUseCase(sessionsRepository)
	})

	it('should be able to revoke all user sessions', async () => {
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

		await sessionsRepository.create(
			await makeSession(
				{
					userId: new UniqueEntityID('user-1'),
					ipAddress: '192.168.0.2',
					userAgent: 'node-test',
				},
				new UniqueEntityID('session-2'),
			),
		)

		await sut.execute({
			userId: 'user-1',
		})

		expect(sessionsRepository.items[0].revokedAt).toEqual(expect.any(Date))
		expect(sessionsRepository.items[1].revokedAt).toEqual(expect.any(Date))
	})
})
