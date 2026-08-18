import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Patch,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { InvalidTokenError } from '@/domain/identity/application/use-cases/errors/invalid-token-error'
import { ResetPasswordUseCase } from '@/domain/identity/application/use-cases/reset-password'
import { Public } from '@/infra/auth/public.decorator'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { type ResetPasswordDto, resetPasswordSchema } from './dto/reset-password.dto'

@Controller()
@Public()
export class ResetPasswordController {
	constructor(private readonly resetPassword: ResetPasswordUseCase) {}

	@Patch('/api/profile/password-recover')
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

		return null
	}
}
