import { HasherStub } from '../../../../../test/stubs/hasher'
import { InMemoryUsersRepository } from '../../../../../test/unit/repositories/in-memory-users-repository'
import { User } from '../../enterprise/entities/user'
import { Hasher } from '../cryptography/hasher'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'
import { RegisterUseCase } from './register'

let usersRepository: InMemoryUsersRepository
let hasher: Hasher

let sut: RegisterUseCase

describe('Register user [USE CASE]', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository()
		hasher = new HasherStub()

		sut = new RegisterUseCase(usersRepository, hasher)
	})

	it('should be able to register', async () => {
		const result = await sut.execute({
			name: 'John Doe',
			email: 'johndoe@email.com',
			password: 'JohnDoe123',
			jobTitle: 'Developer',
		})

		expect(result.isRight())

		if (result.isRight()) {
			expect(result.value.user).instanceOf(User)
			expect(usersRepository.items).toHaveLength(1)
			expect(usersRepository.items[0].name).toBe('John Doe')
			expect(usersRepository.items[0].email).toBe('johndoe@email.com')
			expectTypeOf(usersRepository.items[0].passwordHash).toBeString
			expect(usersRepository.items[0].jobTitle).toBe('Developer')
		}
	})

	it('should not be able to register with an email already used', async () => {
		await usersRepository.create(
			User.create({
				email: 'johndoe@email.com',
				passwordHash: await hasher.generate('JohnDoe123'),
			}),
		)

		const result = await sut.execute({
			name: 'John Doe',
			email: 'johndoe@email.com',
			password: 'JohnDoe123',
			jobTitle: 'Developer',
		})

		expect(result.isLeft())
		expect(result.value).instanceOf(UserAlreadyExistsError)
	})
})
