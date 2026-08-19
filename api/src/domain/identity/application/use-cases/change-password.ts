import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { Either, left, right } from '@/core/types/either'
import { Hasher } from '../cryptography/hasher'
import { UsersRepository } from '../repositories/users-repository'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'

type ChangePasswordUseCaseRequest = {
	userId: string
	currentPassword: string
	newPassword: string
}

type ChangePasswordUseCaseResponse = Either<ResourceNotFoundError | InvalidCredentialsError, null>

@Injectable()
export class ChangePasswordUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private hasher: Hasher,
	) {}

	async execute({
		userId,
		currentPassword,
		newPassword,
	}: ChangePasswordUseCaseRequest): Promise<ChangePasswordUseCaseResponse> {
		const user = await this.usersRepository.findById(userId)

		if (!user) {
			return left(new ResourceNotFoundError())
		}

		if (user.passwordHash === null || user.passwordHash === undefined) {
			return left(new InvalidCredentialsError())
		}

		const isPasswordCorrect = await this.hasher.compare(currentPassword, user.passwordHash)

		if (!isPasswordCorrect) {
			return left(new InvalidCredentialsError())
		}

		user.passwordHash = await this.hasher.generate(newPassword)

		await this.usersRepository.save(user)

		return right(null)
	}
}
