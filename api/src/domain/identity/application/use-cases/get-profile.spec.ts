import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { HasherStub } from '../../../../../test/stubs/hasher'
import { InMemoryUsersRepository } from '../../../../../test/unit/repositories/in-memory-users-repository'
import { User } from '../../enterprise/entities/user'
import { GetProfileUseCase } from './get-profile'

let usersRepository: InMemoryUsersRepository

let sut: GetProfileUseCase

describe('Get user profile [USE CASE]', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository()

		sut = new GetProfileUseCase(usersRepository)
	})

	it('should be able to get user profile', async () => {
		await usersRepository.create(
			User.create(
				{
					name: 'John Doe',
					email: 'johndoe@email.com',
					passwordHash: await new HasherStub().generate('JohnDoe123'),
					jobTitle: 'Developer',
				},
				new UniqueEntityID('user-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-1',
		})

		expect(result.isRight())

		if (result.isRight()) {
			expect(usersRepository.items[0].name).toBe('John Doe')
			expect(usersRepository.items[0].jobTitle).toBe('Developer')
			expect(usersRepository.items[0].email).toBe('johndoe@email.com')
		}
	})

	it('should not be able to get profile of user doesnt exists', async () => {
		const result = await sut.execute({
			userId: 'user-1',
		})

		expect(result.isLeft())
		expect(result.value).instanceOf(ResourceNotFoundError)
	})
})
