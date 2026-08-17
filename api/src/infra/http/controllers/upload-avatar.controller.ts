import {
	Controller,
	InternalServerErrorException,
	MaxFileSizeValidator,
	NotFoundException,
	ParseFilePipe,
	Post,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { UploadAvatarUseCase } from '@/domain/identity/application/use-cases/upload-avatar'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'

@Controller()
export class UploadAvatarController {
	constructor(private uploadAvatar: UploadAvatarUseCase) {}

	@Post('file')
	@UseInterceptors(FileInterceptor('file'))
	async handle(
		@CurrentUser()
		user: UserPayload,

		@UploadedFile(
			new ParseFilePipe({
				validators: [new MaxFileSizeValidator({ maxSize: 1000 })],
			}),
		)
		file: Express.Multer.File,
	) {
		const result = await this.uploadAvatar.execute({
			userId: user.id,
			fileName: file.fileName,
			fileType: file.fileType,
			body: file.body,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
					throw new NotFoundException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return null
	}
}
