import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import type { User } from '../../enterprise/entities/user'
import type { UsersRepository } from '../repositories/users-repository'

interface GetProfileUseCaseRequest {
	userId: string
}

type GetProfileUseCaseResponse = Either<ResourceNotFoundError, { user: User }>

export class GetProfileUseCase {
	constructor(private usersRepository: UsersRepository) {}

	async execute({ userId }: GetProfileUseCaseRequest): Promise<GetProfileUseCaseResponse> {
		const user = await this.usersRepository.findById(userId)

		if (!user) {
			return left(new ResourceNotFoundError())
		}

		return right({
			user,
		})
	}
}
