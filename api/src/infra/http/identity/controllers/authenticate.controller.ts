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
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { AuthenticateUseCase } from '@/domain/identity/application/use-cases/authenticate'
import { InvalidCredentialsError } from '@/domain/identity/application/use-cases/errors/invalid-credentials-error'
import { Public } from '@/infra/auth/public.decorator'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import {
	AuthenticateDto,
	AuthenticateResponseDto,
	authenticateSchema,
} from './dto/authenticate.dto'

@ApiTags('Authentication')
@Public()
@Controller('/api/sessions')
export class AuthenticateController {
	constructor(private readonly authenticate: AuthenticateUseCase) {}

	@ApiOperation({ summary: 'authenticate with credentials' })
	@ApiCreatedResponse({ type: AuthenticateResponseDto })
	@ApiBadRequestResponse({ type: ApiErrorResponseDto })
	@Post()
	@HttpCode(201)
	async handle(
		@Body(new ZodValidationPipe(authenticateSchema))
		body: AuthenticateDto,

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
