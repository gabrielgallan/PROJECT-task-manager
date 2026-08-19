import { InMemoryAccountsRepository } from 'test/unit/repositories/in-memory-accounts-repository'
import { InMemoryTokensRepository } from 'test/unit/repositories/in-memory-tokens-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { HasherStub } from '../../../../../test/stubs/hasher'
import { InMemorySessionsRepository } from '../../../../../test/unit/repositories/in-memory-sessions-repository'
import { InMemoryUsersRepository } from '../../../../../test/unit/repositories/in-memory-users-repository'
import { User } from '../../enterprise/entities/user'
import { Hasher } from '../cryptography/hasher'
import { ChangePasswordUseCase } from './change-password'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'

let usersRepository: InMemoryUsersRepository
let hasher: Hasher

let sut: ChangePasswordUseCase

describe('Change password [USE CASE]', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository(
			new InMemorySessionsRepository(),
			new InMemoryAccountsRepository(),
			new InMemoryTokensRepository(),
		)
		hasher = new HasherStub()

		sut = new ChangePasswordUseCase(usersRepository, hasher)
	})

	it('should be able to change user password', async () => {
		await usersRepository.create(
			User.create(
				{
					email: 'johndoe@email.com',
					passwordHash: await hasher.generate('JohnDoe123'),
				},
				new UniqueEntityID('user-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			currentPassword: 'JohnDoe123',
			newPassword: 'johnNewPass123',
		})

		const isPasswordCorrect = await hasher.compare(
			'johnNewPass123',
			usersRepository.items[0].passwordHash!,
		)

		expect(isPasswordCorrect).toBe(true)
	})

	it('should not be able to change password for a non-existent user', async () => {
		const result = await sut.execute({
			userId: 'non-existent-user',
			currentPassword: 'JohnDoe123',
			newPassword: 'johnNewPass123',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).instanceOf(ResourceNotFoundError)
	})

	it('should not be able to change a user password with incorrect or non-existent current password', async () => {
		await usersRepository.create(
			User.create(
				{
					email: 'johndoe@email.com',
					passwordHash: await hasher.generate('JohnDoe123'),
				},
				new UniqueEntityID('user-1'),
			),
		)

		await usersRepository.create(
			User.create(
				{
					email: 'johndoe2@email.com',
					passwordHash: null,
				},
				new UniqueEntityID('user-2'),
			),
		)

		const result1 = await sut.execute({
			userId: 'user-1',
			currentPassword: 'incorretPassword',
			newPassword: 'johnNewPass123',
		})

		const result2 = await sut.execute({
			userId: 'user-1',
			currentPassword: 'nonExistentPassword',
			newPassword: 'johnNewPass123',
		})

		expect(result1.value).instanceOf(InvalidCredentialsError)
		expect(result2.value).instanceOf(InvalidCredentialsError)
	})
})
