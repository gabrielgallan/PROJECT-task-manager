import {
	Controller,
	Get,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { GetProfileUseCase } from '@/domain/identity/application/use-cases/get-profile'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { UserPresenter } from '../presenters/user-presenter'
import { GetProfileResponseDto } from './dto/get-profile.dto'

@ApiTags('Profile')
@Controller('/api/profile')
export class GetProfileController {
	constructor(private readonly getProfile: GetProfileUseCase) {}

	@ApiOperation({ summary: 'get profile' })
	@ApiOkResponse({ description: 'User profile returned', type: GetProfileResponseDto })
	@ApiNotFoundResponse({ description: 'User not found', type: ApiErrorResponseDto })
	@Get()
	@HttpCode(200)
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
