import { type Either, left, right } from '@/core/types/either'
import { User } from '../../enterprise/entities/user'
import type { Hasher } from '../cryptography/hasher'
import type { UsersRepository } from '../repositories/users-repository'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'

interface RegisterUseCaseRequest {
	name: string
	email: string
	password: string
}

type RegisterUseCaseResponse = Either<UserAlreadyExistsError, { user: User }>

export class RegisterUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private hasher: Hasher,
	) {}

	async execute({
		name,
		email,
		password,
	}: RegisterUseCaseRequest): Promise<RegisterUseCaseResponse> {
		const userWithSameEmail = await this.usersRepository.findByEmail(email)

		if (userWithSameEmail) {
			return left(new UserAlreadyExistsError())
		}

		const user = User.create({
			name,
			email,
			passwordHash: await this.hasher.generate(password),
		})

		await this.usersRepository.create(user)

		return right({
			user,
		})
	}
}
