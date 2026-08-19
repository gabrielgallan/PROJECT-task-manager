import { Controller, Delete, HttpCode, InternalServerErrorException } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RevokeAllSessionsUseCase } from '@/domain/identity/application/use-cases/revoke-all-sessions'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'
import { RevokeAllSessionsReponseDto } from './dto/revoke-all-sessions.dto'

@ApiTags('Authentication')
@Controller('/api/sessions')
export class RevokeAllSessionsController {
	constructor(private readonly revokeAllSessions: RevokeAllSessionsUseCase) {}

	@ApiOperation({ summary: 'revoke all sessions' })
	@ApiOkResponse({
		description: 'User sessions revoked successfully',
		type: RevokeAllSessionsReponseDto,
	})
	@Delete()
	@HttpCode(200)
	async handle(@CurrentUser() user: UserPayload) {
		const result = await this.revokeAllSessions.execute({
			userId: user.id,
		})

		if (result.isLeft()) {
			throw new InternalServerErrorException()
		}

		return {
			sessionsCount: result.value.sessionsCount,
		}
	}
}
