import { makeSession } from 'test/unit/factories/make-session'
import { makeToken } from 'test/unit/factories/make-token'
import { InMemoryAccountsRepository } from 'test/unit/repositories/in-memory-accounts-repository'
import { InMemoryTokensRepository } from 'test/unit/repositories/in-memory-tokens-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemorySessionsRepository } from '../../../../../test/unit/repositories/in-memory-sessions-repository'
import { InMemoryUsersRepository } from '../../../../../test/unit/repositories/in-memory-users-repository'
import { Account } from '../../enterprise/entities/account'
import { User } from '../../enterprise/entities/user'
import { DeleteUserUseCase } from './delete-user'

let usersRepository: InMemoryUsersRepository

let sessionsRepository: InMemorySessionsRepository
let accountsRepository: InMemoryAccountsRepository
let tokensRepository: InMemoryTokensRepository

let sut: DeleteUserUseCase

describe('Delete user account and your data [USE CASE]', () => {
	beforeEach(() => {
		sessionsRepository = new InMemorySessionsRepository()
		accountsRepository = new InMemoryAccountsRepository()
		tokensRepository = new InMemoryTokensRepository()

		usersRepository = new InMemoryUsersRepository(
			sessionsRepository,
			accountsRepository,
			tokensRepository,
		)

		sut = new DeleteUserUseCase(usersRepository)
	})

	it('should be able to delete user and data', async () => {
		await usersRepository.create(
			User.create(
				{
					email: 'johndoe@email.com',
				},
				new UniqueEntityID('user-1'),
			),
		)

		await accountsRepository.create(
			Account.create({
				userId: new UniqueEntityID('user-1'),
				provider: 'GITHUB',
			}),
		)

		await tokensRepository.create(
			await makeToken({
				userId: new UniqueEntityID('user-1'),
				type: 'PASSWORD_RECOVER',
			}),
		)

		await sessionsRepository.create(
			await makeSession({
				userId: new UniqueEntityID('user-1'),
			}),
		)

		await sut.execute({
			userId: 'user-1',
		})

		expect(sessionsRepository.items).toHaveLength(0)
		expect(accountsRepository.items).toHaveLength(0)
		expect(tokensRepository.items).toHaveLength(0)
		expect(usersRepository.items).toHaveLength(0)
	})
})
