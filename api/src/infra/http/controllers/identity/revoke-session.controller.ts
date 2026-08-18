import {
	Controller,
	Delete,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
	UnauthorizedException,
} from '@nestjs/common'
import {
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { RevokeSessionUseCase } from '@/domain/identity/application/use-cases/revoke-session'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { ApiErrorResponseDto } from './dto/api-error-response.dto'
import { RevokeSessionDto, revokeSessionSchema } from './dto/revoke-session.dto'

@ApiTags('Authentication')
@Controller('/api/sessions/:sessionId')
export class RevokeSessionController {
	constructor(private readonly revokeSession: RevokeSessionUseCase) {}

	@ApiOperation({ summary: 'revoke session' })
	@ApiNoContentResponse({ description: 'Session revoked successfully' })
	@ApiNotFoundResponse({ description: 'Session not found', type: ApiErrorResponseDto })
	@ApiUnauthorizedResponse({
		description: 'Not allowed to revoke this session',
		type: ApiErrorResponseDto,
	})
	@Delete()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Param(new ZodValidationPipe(revokeSessionSchema))
		params: RevokeSessionDto,
	) {
		const result = await this.revokeSession.execute({
			userId: user.id,
			sessionId: params.sessionId,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
					throw new NotFoundException(error.message)

				case NotAllowedError:
					throw new UnauthorizedException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
