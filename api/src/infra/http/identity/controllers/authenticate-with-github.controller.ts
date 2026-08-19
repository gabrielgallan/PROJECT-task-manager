import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	Post,
	Req,
	Res,
} from '@nestjs/common'
import {
	ApiBadGatewayResponse,
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { AccountProvider } from '@/../generated/prisma/client'
import { AuthenticateWithProviderUseCase } from '@/domain/identity/application/use-cases/authenticate-with-provider'
import { UnsupportedAuthProviderError } from '@/domain/identity/application/use-cases/errors/unsupported-auth-provider-error'
import { Public } from '@/infra/auth/public.decorator'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { AuthenticateResponseDto } from './dto/authenticate.dto'
import {
	AuthenticateWithProviderDto,
	authenticateWithProviderSchema,
} from './dto/authenticate-with-provider.dto'

@ApiTags('Authentication')
@Public()
@Controller('/api/sessions/github')
export class AuthenticateWithGithubController {
	constructor(private authenticateWithGitHub: AuthenticateWithProviderUseCase) {}

	@ApiOperation({ summary: 'authenticate with github' })
	@ApiCreatedResponse({ type: AuthenticateResponseDto })
	@ApiBadRequestResponse({ type: ApiErrorResponseDto })
	@ApiBadGatewayResponse({ type: ApiErrorResponseDto })
	@Post()
	@HttpCode(201)
	async handle(
		@Body(new ZodValidationPipe(authenticateWithProviderSchema))
		body: AuthenticateWithProviderDto,

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
