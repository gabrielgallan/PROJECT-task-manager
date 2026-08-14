import { HasherStub } from 'test/stubs/hasher'
import { makeToken } from 'test/unit/factories/make-token'
import { makeUser } from 'test/unit/factories/make-user'
import { InMemoryTokensRepository } from 'test/unit/repositories/in-memory-tokens-repository'
import { InMemoryUsersRepository } from 'test/unit/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import type { Hasher } from '../cryptography/hasher'
import { InvalidTokenError } from './errors/invalid-token-error'
import { ResetPasswordUseCase } from './reset-password'

let usersRepository: InMemoryUsersRepository
let tokensRepository: InMemoryTokensRepository
let hasher: Hasher

let sut: ResetPasswordUseCase

describe('Reset user password [USE CASE]', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository()
		tokensRepository = new InMemoryTokensRepository()
		hasher = new HasherStub()

		sut = new ResetPasswordUseCase(usersRepository, tokensRepository, hasher)

		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('should be able to reset a user password with a valid token', async () => {
		await usersRepository.create(await makeUser({}, new UniqueEntityID('user-1')))

		await tokensRepository.create(
			await makeToken(
				{
					userId: new UniqueEntityID('user-1'),
					type: 'PASSWORD_RECOVER',
				},
				new UniqueEntityID('token-1'),
			),
		)

		const result = await sut.execute({
			recoverCode: 'token-1',
			password: 'new-password',
		})

		expect(result.isRight()).toBe(true)
	})

	it('should not be able to reset a user password with an expired token', async () => {
		vi.setSystemTime(new Date(2025, 0, 13, 12, 0, 0))

		await usersRepository.create(await makeUser({}, new UniqueEntityID('user-1')))

		await tokensRepository.create(
			await makeToken(
				{
					userId: new UniqueEntityID('user-1'),
					type: 'PASSWORD_RECOVER',
				},
				new UniqueEntityID('token-1'),
			),
		)

		vi.setSystemTime(new Date(2025, 0, 13, 14, 0, 0))

		const result = await sut.execute({
			recoverCode: 'token-1',
			password: 'new-password',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(InvalidTokenError)
	})

	it('should not be able to reset a user password with a used token', async () => {
		await usersRepository.create(await makeUser({}, new UniqueEntityID('user-1')))

		await tokensRepository.create(
			await makeToken(
				{
					userId: new UniqueEntityID('user-1'),
					type: 'PASSWORD_RECOVER',
				},
				new UniqueEntityID('token-1'),
			),
		)

		await sut.execute({
			recoverCode: 'token-1',
			password: 'new-password',
		})

		const result = await sut.execute({
			recoverCode: 'token-1',
			password: 'new-password',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(InvalidTokenError)
	})

	it('should not be able to reset the password of a non-existent resource (token|user)', async () => {
		const result = await sut.execute({
			recoverCode: 'token-1',
			password: 'new-password',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(ResourceNotFoundError)
	})
})
