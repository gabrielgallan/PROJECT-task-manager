import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { UsersRepository } from '../repositories/users-repository'

type EditProfileUseCaseRequest = {
	userId: string
	name?: string | null
	jobTitle?: string | null
}

type EditProfileUseCaseResponse = Either<ResourceNotFoundError, null>

@Injectable()
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

		if (name !== undefined) user.name = name

		if (jobTitle !== undefined) user.jobTitle = jobTitle

		await this.usersRepository.save(user)

		return right(null)
	}
}
