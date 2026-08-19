import {
	Controller,
	Delete,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { ApiNoContentResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { DeleteUserUseCase } from '@/domain/identity/application/use-cases/delete-user'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'

@ApiTags('Profile')
@Controller('/api/profile')
export class DeleteUserController {
	constructor(private readonly deleteUser: DeleteUserUseCase) {}

	@ApiOperation({ summary: 'delete user' })
	@ApiNoContentResponse({ description: 'User and data deleted successfully' })
	@ApiNotFoundResponse({ type: ApiErrorResponseDto })
	@Delete()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,
	) {
		const result = await this.deleteUser.execute({
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

		return
	}
}
