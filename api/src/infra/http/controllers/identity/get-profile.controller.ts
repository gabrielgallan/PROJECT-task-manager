import { Controller, Get, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { GetProfileUseCase } from '@/domain/identity/application/use-cases/get-profile'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'
import { UserPresenter } from '../../presenters/user-presenter'

@Controller()
export class GetProfileController {
	constructor(private readonly getProfile: GetProfileUseCase) {}

	@Get('/api/profile')
	async handle(@CurrentUser() user: UserPayload) {
		const result = await this.getProfile.execute({
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
			profile: UserPresenter.toHTTP(result.value.user),
		}
	}
}
