import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Put,
	UnauthorizedException,
} from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditCategoryUseCase } from '@/domain/task-manager/application/use-cases/edit-category'
import { InvalidCategoryError } from '@/domain/task-manager/application/use-cases/errors/invalid-category-error'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import {
	EditCategoryDto,
	EditCategoryParamDto,
	editCategoryParamSchema,
	editCategorySchema,
} from './dto/edit-category.dto'

@Controller('/api/categories/:categoryId')
export class EditCategoryController {
	constructor(private editCategory: EditCategoryUseCase) {}

	@Put()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(editCategorySchema))
		body: EditCategoryDto,

		@Param(new ZodValidationPipe(editCategoryParamSchema))
		param: EditCategoryParamDto,
	) {
		const { name, color } = body

		const result = await this.editCategory.execute({
			userId: user.id,
			categoryId: param.categoryId,
			name,
			color,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
					throw new NotFoundException(error.message)

				case NotAllowedError:
					throw new UnauthorizedException(error.message)

				case InvalidCategoryError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
