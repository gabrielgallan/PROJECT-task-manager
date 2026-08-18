import {
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Post,
	Res,
	UnauthorizedException,
} from '@nestjs/common'
import type { Response } from 'express'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { RevokeSessionUseCase } from '@/domain/identity/application/use-cases/revoke-session'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import type { UserPayload } from '@/infra/auth/user-payload'

@Controller()
export class SignOutController {
	constructor(private readonly revokeSession: RevokeSessionUseCase) {}

	@Post('/api/sign-out')
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Res()
		response: Response,
	) {
		const result = await this.revokeSession.execute({
			userId: user.id,
			sessionId: user.sessionId,
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

		response.clearCookie(SESSION_COOKIE_NAME)

		return response.send(null)
	}
}
