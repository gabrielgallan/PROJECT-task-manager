import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import type { UsersRepository } from '../repositories/users-repository'

type EditProfileUseCaseRequest = {
	userId: string
	name?: string
	jobTitle?: string
}

type EditProfileUseCaseResponse = Either<ResourceNotFoundError, null>

export class EditProfileUseCase {
	constructor(private usersRepository: UsersRepository) {}

	async execute({
		userId,
		name,
		jobTitle,
	}: EditProfileUseCaseRequest): Promise<EditProfileUseCaseResponse> {
		const user = await this.usersRepository.findById(userId)

		if (!user) {
			return left(new ResourceNotFoundError())
		}

		if (name) user.name = name

		if (jobTitle) user.jobTitle = jobTitle

		await this.usersRepository.save(user)

		return right(null)
	}
}
