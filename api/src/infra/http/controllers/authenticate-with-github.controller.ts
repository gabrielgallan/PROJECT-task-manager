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
import z from 'zod'
import { AccountProvider } from '@/../generated/prisma/client'
import { AuthenticateWithProviderUseCase } from '@/domain/identity/application/use-cases/authenticate-with-provider'
import { UnsupportedAuthProviderError } from '@/domain/identity/application/use-cases/errors/unsupported-auth-provider-error'
import { Public } from '@/infra/auth/public.decorator'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'

const authenticateWithGithubBodySchema = z.object({
	code: z.string(),
})

type AuthenticateWithGithubBody = z.infer<typeof authenticateWithGithubBodySchema>

@Controller()
@Public()
export class AuthenticateWithGithubController {
	constructor(private authenticateWithGitHub: AuthenticateWithProviderUseCase) {}

	@Post('/api/sessions/github')
	async handle(
		@Body(new ZodValidationPipe(authenticateWithGithubBodySchema))
		body: AuthenticateWithGithubBody,

		@Req()
		request: Request,

		@Res({ passthrough: true })
		response: Response,
	) {
		const { code } = body

		const result = await this.authenticateWithGitHub.execute({
			provider: AccountProvider.GITHUB,
			code,
			ipAddress: request.ip,
			userAgent: request.header['user-agent'],
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
