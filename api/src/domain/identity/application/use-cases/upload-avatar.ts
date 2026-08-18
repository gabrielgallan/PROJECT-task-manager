import type { Readable } from 'node:stream'
import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { UsersRepository } from '../repositories/users-repository'
import { Uploader } from '../storage/uploader'
import { InvalidImageTypeError } from './errors/invalid-image-type-error'

type UploadAvatarUseCaseRequest = {
	userId: string
	fileName: string
	fileType: string
	body: Readable
}

type UploadAvatarUseCaseResponse = Either<ResourceNotFoundError | InvalidImageTypeError, null>

@Injectable()
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
		if (!/^image\/(jpeg|png|webp|heic)$/.test(fileType)) {
			return left(new InvalidImageTypeError())
		}

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
