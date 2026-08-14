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
import { z } from 'zod'
import { AuthenticateUseCase } from '@/domain/identity/application/use-cases/authenticate'
import { InvalidCredentialsError } from '@/domain/identity/application/use-cases/errors/invalid-credentials-error'
import { Public } from '@/infra/auth/public.decorator'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'

const authenticateBodySchema = z.object({
	email: z.email(),
	password: z.string(),
})

type AuthenticateBody = z.infer<typeof authenticateBodySchema>

@Controller()
export class AuthenticateController {
	constructor(private readonly authenticate: AuthenticateUseCase) {}

	@Public()
	@Post('/api/sessions')
	async handle(
		@Body(new ZodValidationPipe(authenticateBodySchema))
		body: AuthenticateBody,

		@Req()
		request: Request,

		@Res({ passthrough: true })
		response: Response,
	) {
		const { email, password } = body

		const result = await this.authenticate.execute({
			email,
			password,
			ipAddress: request.ip,
			userAgent: request.headers['user-agent'],
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case InvalidCredentialsError:
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
