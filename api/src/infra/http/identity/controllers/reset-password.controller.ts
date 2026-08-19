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
import { InvalidTokenError } from '@/domain/identity/application/use-cases/errors/invalid-token-error'
import { ResetPasswordUseCase } from '@/domain/identity/application/use-cases/reset-password'
import { Public } from '@/infra/auth/public.decorator'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ResetPasswordDto, resetPasswordSchema } from './dto/reset-password.dto'

@ApiTags('Profile')
@Public()
@Controller('/api/profile/password-recover')
export class ResetPasswordController {
	constructor(private readonly resetPassword: ResetPasswordUseCase) {}

	@ApiOperation({ summary: 'reset password' })
	@ApiNoContentResponse({ description: 'Password updated successfully' })
	@ApiNotFoundResponse({ description: 'Token or User not found', type: ApiErrorResponseDto })
	@ApiBadRequestResponse({
		description: 'Invalid token (expired or already used)',
		type: ApiErrorResponseDto,
	})
	@Patch()
	@HttpCode(204)
	async handle(
		@Body(new ZodValidationPipe(resetPasswordSchema))
		body: ResetPasswordDto,
	) {
		const { tokenId, password } = body

		const result = await this.resetPassword.execute({
			tokenId,
			password,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
					throw new NotFoundException(error.message)

				case InvalidTokenError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
