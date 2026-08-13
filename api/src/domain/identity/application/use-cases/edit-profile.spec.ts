import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { HasherStub } from '../../../../../test/stubs/hasher'
import { InMemoryUsersRepository } from '../../../../../test/unit/repositories/in-memory-users-repository'
import { User } from '../../enterprise/entities/user'
import { EditProfileUseCase } from './edit-profile'

let usersRepository: InMemoryUsersRepository

let sut: EditProfileUseCase

describe('Edit user profile [USE CASE]', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository()

		sut = new EditProfileUseCase(usersRepository)
	})

	it('should be able to edit user profile', async () => {
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
			name: 'John',
			jobTitle: 'Product Manager',
		})

		expect(result.isRight())

		if (result.isRight()) {
			expect(usersRepository.items[0].name).toBe('John')
			expect(usersRepository.items[0].jobTitle).toBe('Product Manager')
		}
	})

	it('should not be able to edit profile of user doesnt exists', async () => {
		const result = await sut.execute({
			userId: 'user-1',
		})

		expect(result.isLeft())
		expect(result.value).instanceOf(ResourceNotFoundError)
	})
})
