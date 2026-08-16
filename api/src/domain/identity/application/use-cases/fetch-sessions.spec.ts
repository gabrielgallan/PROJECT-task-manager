import { makeSession } from 'test/unit/factories/make-session'
import { makeUser } from 'test/unit/factories/make-user'
import { InMemorySessionsRepository } from 'test/unit/repositories/in-memory-sessions-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { InMemoryUsersRepository } from '../../../../../test/unit/repositories/in-memory-users-repository'
import { FetchSessionsUseCase } from './fetch-sessions'

let usersRepository: InMemoryUsersRepository
let sessionsRepository: InMemorySessionsRepository

let sut: FetchSessionsUseCase

describe('Edit user profile [USE CASE]', () => {
	beforeEach(() => {
		sessionsRepository = new InMemorySessionsRepository()
		usersRepository = new InMemoryUsersRepository()

		sut = new FetchSessionsUseCase(sessionsRepository, usersRepository)
	})

	it('should be able to fetch user sessions', async () => {
		await usersRepository.create(
			await makeUser(
				{
					email: 'johndoe@email.com',
				},
				new UniqueEntityID('user-1'),
			),
		)

		await sessionsRepository.create(
			await makeSession({
				userId: new UniqueEntityID('user-1'),
				ipAddress: '192.168.0.1',
				userAgent: 'node-test',
			}),
		)

		await sessionsRepository.create(
			await makeSession({
				userId: new UniqueEntityID('user-1'),
				ipAddress: '192.168.0.2',
				userAgent: 'node-test',
			}),
		)

		const result = await sut.execute({
			userId: 'user-1',
		})

		expect(result.isRight())

		if (result.isRight()) {
			expect(result.value.sessions).toHaveLength(2)
		}
	})

	it('should not be able to fetch sessions of a non-exists user', async () => {
		const result = await sut.execute({
			userId: 'user-1',
		})

		expect(result.isLeft())
		expect(result.value).instanceOf(ResourceNotFoundError)
	})
})
