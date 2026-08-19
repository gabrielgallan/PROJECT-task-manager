import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Patch,
} from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { ChangePasswordUseCase } from '@/domain/identity/application/use-cases/change-password'
import { InvalidCredentialsError } from '@/domain/identity/application/use-cases/errors/invalid-credentials-error'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { ChangePasswordDto, changePasswordSchema } from './dto/change-password.dto'

@ApiTags('Profile')
@Controller('/api/profile/password')
export class ChangePasswordController {
	constructor(private changePassword: ChangePasswordUseCase) {}

	@ApiOperation({ summary: 'change password' })
	@ApiNoContentResponse({ description: 'User password changed successfully' })
	@ApiNotFoundResponse({ description: 'User not found', type: ApiErrorResponseDto })
	@ApiBadRequestResponse({
		description: 'User invalid current password',
		type: ApiErrorResponseDto,
	})
	@Patch()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(changePasswordSchema))
		body: ChangePasswordDto,
	) {
		const result = await this.changePassword.execute({
			userId: user.id,
			currentPassword: body.currentPassword,
			newPassword: body.newPassword,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
					throw new NotFoundException(error.message)

				case InvalidCredentialsError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
