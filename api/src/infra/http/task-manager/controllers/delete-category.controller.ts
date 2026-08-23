import {
	Controller,
	Delete,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
	UnauthorizedException,
} from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { DeleteCategoryUseCase } from '@/domain/task-manager/application/use-cases/delete-category'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { DeleteCategoryParamDto, deleteCategoryParamSchema } from './dto/delete-category.dto'

@Controller('/api/categories/:categoryId')
export class DeleteCategoryController {
	constructor(private deleteCategory: DeleteCategoryUseCase) {}

	@Delete()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Param(new ZodValidationPipe(deleteCategoryParamSchema))
		param: DeleteCategoryParamDto,
	) {
		const result = await this.deleteCategory.execute({
			userId: user.id,
			categoryId: param.categoryId,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
					throw new NotFoundException(error.message)

				case NotAllowedError:
					throw new UnauthorizedException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
