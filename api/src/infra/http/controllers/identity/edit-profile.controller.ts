import {
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Put,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditProfileUseCase } from '@/domain/identity/application/use-cases/edit-profile'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { type EditProfileDto, editProfileSchema } from './dto/edit-profile.dto'

@Controller()
export class EditProfileController {
	constructor(private readonly editProfile: EditProfileUseCase) {}

	@Put('/api/profile')
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(editProfileSchema))
		body: EditProfileDto,
	) {
		const { name, jobTitle } = body

		const result = await this.editProfile.execute({
			userId: user.id,
			name,
			jobTitle,
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
