import {
	BadRequestException,
	Body,
	Controller,
	InternalServerErrorException,
	Post,
	Req,
	Res,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { AuthenticateWithProviderUseCase } from '@/domain/identity/application/use-cases/authenticate-with-provider'
import { UnsupportedAuthProviderError } from '@/domain/identity/application/use-cases/errors/unsupported-auth-provider-error'
import { Public } from '@/infra/auth/public.decorator'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import {
	type AuthenticateWithProviderDto,
	authenticateWithProviderSchema,
} from './dto/authenticate-with-provider.dto'

@Controller()
@Public()
export class AuthenticateWithGoogleController {
	constructor(private authenticateWithGoogle: AuthenticateWithProviderUseCase) {}

	@Post('/api/sessions/google')
	async handle(
		@Body(new ZodValidationPipe(authenticateWithProviderSchema))
		body: AuthenticateWithProviderDto,

		@Req()
		request: Request,

		@Res({ passthrough: true })
		response: Response,
	) {
		const { code } = body

		const result = await this.authenticateWithGoogle.execute({
			provider: 'GOOGLE',
			code,
			ipAddress: request.ip,
			userAgent: request.header('user-agent'),
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case UnsupportedAuthProviderError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		const { token } = result.value

		response.cookie(SESSION_COOKIE_NAME, token, {
			httpOnly: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 1000 * 60 * 60 * 24 * 7,
		})

		return {
			success: true,
		}
	}
}
