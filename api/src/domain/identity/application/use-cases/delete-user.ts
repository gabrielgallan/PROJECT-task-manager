import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { UsersRepository } from '../repositories/users-repository'

type DeleteUserUseCaseRequest = {
	userId: string
}

type DeleteUserUseCaseResponse = Either<ResourceNotFoundError, null>

@Injectable()
export class DeleteUserUseCase {
	constructor(private usersRepository: UsersRepository) {}

	async execute({ userId }: DeleteUserUseCaseRequest): Promise<DeleteUserUseCaseResponse> {
		const user = await this.usersRepository.findById(userId)

		if (!user) {
			return left(new ResourceNotFoundError())
		}

		await this.usersRepository.delete(user)

		return right(null)
	}
}
