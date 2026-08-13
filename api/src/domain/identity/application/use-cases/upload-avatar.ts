import type { Readable } from 'node:stream'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import type { UsersRepository } from '../repositories/users-repository'
import type { Uploader } from '../storage/uploader'

interface UploadAvatarUseCaseRequest {
	userId: string
	fileName: string
	fileType: string
	body: Readable
}

type UploadAvatarUseCaseResponse = Either<ResourceNotFoundError, null>

export class UploadAvatarUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private uploader: Uploader,
	) {}

	async execute({
		userId,
		fileName,
		fileType,
		body,
	}: UploadAvatarUseCaseRequest): Promise<UploadAvatarUseCaseResponse> {
		const user = await this.usersRepository.findById(userId)

		if (!user) {
			return left(new ResourceNotFoundError())
		}

		const { url } = await this.uploader.uploadAvatar({
			fileName,
			fileType,
			body,
		})

		user.avatarUrl = url

		await this.usersRepository.save(user)

		return right(null)
	}
}
