import {
	Controller,
	Get,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { FetchSessionsUseCase } from '@/domain/identity/application/use-cases/fetch-sessions'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'
import { SessionPresenter } from '../presenters/session-presenter'
import { FetchSessionResponseDto } from './dto/fetch-sessions.dto'

@ApiTags('Authentication')
@Controller('/api/sessions')
export class FetchSessionController {
	constructor(private readonly fetchSessions: FetchSessionsUseCase) {}

	@ApiOperation({ summary: 'fetch sessions' })
	@ApiOkResponse({
		description: 'User sessions fetched successfully',
		type: FetchSessionResponseDto,
	})
	@Get()
	@HttpCode(200)
	async handle(
		@CurrentUser()
		user: UserPayload,
	) {
		const result = await this.fetchSessions.execute({
			userId: user.id,
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

		return {
			sessions: result.value.sessions.map((session) =>
				SessionPresenter.toHTTP(session, user.sessionId),
			),
		}
	}
}
