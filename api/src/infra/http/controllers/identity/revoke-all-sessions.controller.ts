import { Controller, Delete, HttpCode, InternalServerErrorException } from '@nestjs/common'
import { RevokeAllSessionsUseCase } from '@/domain/identity/application/use-cases/revoke-all-sessions'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'

@Controller()
export class RevokeAllSessionsController {
	constructor(private readonly revokeAllSessions: RevokeAllSessionsUseCase) {}

	@Delete('/api/sessions')
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
