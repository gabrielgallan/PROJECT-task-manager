import { Readable } from 'node:stream'
import { UploaderStub } from 'test/stubs/uploader'
import { makeUser } from 'test/unit/factories/make-user'
import { InMemoryAccountsRepository } from 'test/unit/repositories/in-memory-accounts-repository'
import { InMemorySessionsRepository } from 'test/unit/repositories/in-memory-sessions-repository'
import { InMemoryTokensRepository } from 'test/unit/repositories/in-memory-tokens-repository'
import { InMemoryUsersRepository } from 'test/unit/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { InvalidImageTypeError } from './errors/invalid-image-type-error'
import { UploadAvatarUseCase } from './upload-avatar'

let usersRepository: InMemoryUsersRepository
let uploader: UploaderStub

let sut: UploadAvatarUseCase

describe('Upload user avatar [USE CASE]', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository(
			new InMemorySessionsRepository(),
			new InMemoryAccountsRepository(),
			new InMemoryTokensRepository(),
		)
		uploader = new UploaderStub()

		sut = new UploadAvatarUseCase(usersRepository, uploader)
	})

	it('should be able to upload an user avatar', async () => {
		await usersRepository.create(await makeUser({}, new UniqueEntityID('user-1')))

		await sut.execute({
			userId: 'user-1',
			fileName: 'avatar.png',
			fileType: 'image/png',
			body: Readable.from(Buffer.from('')),
		})

		expect(usersRepository.items[0].avatarUrl).toEqual(expect.any(String))
		expect(uploader.uploads[0]).toMatchObject({
			fileName: 'avatar.png',
			url: expect.any(String),
		})
	})

	it('should not be able to upload avatar of a non-existent user', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			fileName: 'avatar.png',
			fileType: 'image/png',
			body: Readable.from(Buffer.from('')),
		})

		expect(result.value).instanceOf(ResourceNotFoundError)
	})

	it('should not be able to upload an unsupported image type', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			fileName: 'avatar.png',
			fileType: 'image/svg',
			body: Readable.from(Buffer.from('')),
		})

		expect(result.value).instanceOf(InvalidImageTypeError)
	})
})
