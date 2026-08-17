import {
	Controller,
	Delete,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
} from '@nestjs/common'
import { z } from 'zod'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { RevokeSessionUseCase } from '@/domain/identity/application/use-cases/revoke-session'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'

const revokeSessionParamsSchema = z.object({
	sessionId: z.uuid(),
})

type RevokeSessionParams = z.infer<typeof revokeSessionParamsSchema>

@Controller()
export class RevokeSessionController {
	constructor(private readonly revokeSession: RevokeSessionUseCase) {}

	@Delete('/api/sessions/:sessionId')
	@HttpCode(204)
	async handle(
		@Param(new ZodValidationPipe(revokeSessionParamsSchema))
		params: RevokeSessionParams,
	) {
		const { sessionId } = params

		const result = await this.revokeSession.execute({
			sessionId,
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

		return null
	}
}
