import { EmailSenderStub } from 'test/stubs/email-sender'
import { makeUser } from 'test/unit/factories/make-user'
import { InMemoryTokensRepository } from 'test/unit/repositories/in-memory-tokens-repository'
import { InMemoryUsersRepository } from 'test/unit/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { RequestPasswordRecoverUseCase } from './request-password-recover'

let usersRepository: InMemoryUsersRepository
let tokensRepository: InMemoryTokensRepository
let emailSender: EmailSenderStub

let sut: RequestPasswordRecoverUseCase

describe('Request password recover [USE CASE]', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository()
		tokensRepository = new InMemoryTokensRepository()
		emailSender = new EmailSenderStub()

		sut = new RequestPasswordRecoverUseCase(usersRepository, tokensRepository, emailSender)
	})

	it('should be able to request password recover', async () => {
		await usersRepository.create(
			await makeUser(
				{
					email: 'johndoe@email.com',
				},
				new UniqueEntityID('user-1'),
			),
		)

		const result = await sut.execute({
			email: 'johndoe@email.com',
		})

		expect(result.isRight()).toBe(true)
		expect(emailSender.emails[0].to).toBe('johndoe@email.com')
		expect(tokensRepository.items[0].userId.toString()).toBe('user-1')
	})

	it("shouldn't be able to request password recover from an user does not exists", async () => {
		const result = await sut.execute({
			email: 'johndoe@email.com',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).instanceOf(ResourceNotFoundError)
	})
})
