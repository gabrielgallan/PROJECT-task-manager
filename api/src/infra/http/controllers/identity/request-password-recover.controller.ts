import {
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Post,
} from '@nestjs/common'
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { RequestPasswordRecoverUseCase } from '@/domain/identity/application/use-cases/request-password-recover'
import { Public } from '@/infra/auth/public.decorator'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { ApiErrorResponseDto } from './dto/api-error-response.dto'
import {
	RequestPasswordRecoverDto,
	requestPasswordRecoverSchema,
} from './dto/request-password-recover.dto'

@ApiTags('Profile')
@Public()
@Controller('/api/profile/password-recover')
export class RequestPasswordRecoverController {
	constructor(private readonly requestPasswordRecover: RequestPasswordRecoverUseCase) {}

	@ApiOperation({ summary: 'request password recover' })
	@ApiCreatedResponse({ description: 'Password recovery link successfully sent' })
	@ApiNotFoundResponse({ description: 'User not found', type: ApiErrorResponseDto })
	@Post()
	@HttpCode(201)
	async handle(
		@Body(new ZodValidationPipe(requestPasswordRecoverSchema))
		body: RequestPasswordRecoverDto,
	) {
		const { email } = body

		const result = await this.requestPasswordRecover.execute({
			email,
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

		return
	}
}
