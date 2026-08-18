import { Readable } from 'node:stream'
import {
	BadRequestException,
	Controller,
	HttpCode,
	InternalServerErrorException,
	MaxFileSizeValidator,
	NotFoundException,
	ParseFilePipe,
	Put,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
	ApiBadRequestResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { InvalidImageTypeError } from '@/domain/identity/application/use-cases/errors/invalid-image-type-error'
import { UploadAvatarUseCase } from '@/domain/identity/application/use-cases/upload-avatar'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from './dto/api-error-response.dto'

@ApiTags('Profile')
@Controller('/api/profile/avatar')
export class UploadAvatarController {
	constructor(private uploadAvatar: UploadAvatarUseCase) {}

	@ApiOperation({ summary: 'upload avatar' })
	@ApiNoContentResponse({ description: 'User avatar updated successfully' })
	@ApiNotFoundResponse({ description: 'User not found', type: ApiErrorResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid image type', type: ApiErrorResponseDto })
	@Put()
	@HttpCode(204)
	@UseInterceptors(FileInterceptor('file'))
	async handle(
		@CurrentUser()
		user: UserPayload,

		@UploadedFile(
			new ParseFilePipe({
				validators: [new MaxFileSizeValidator({ maxSize: 5000000 })],
			}),
		)
		file: Express.Multer.File,
	) {
		const result = await this.uploadAvatar.execute({
			userId: user.id,
			fileName: file.originalname,
			fileType: file.mimetype,
			body: Readable.from(file.buffer),
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
					throw new NotFoundException(error.message)

				case InvalidImageTypeError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
