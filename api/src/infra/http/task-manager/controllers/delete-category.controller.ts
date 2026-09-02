import {
	Controller,
	Delete,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
} from '@nestjs/common'
import { ApiNoContentResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { DeleteCategoryUseCase } from '@/domain/task-manager/application/use-cases/delete-category'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { DeleteCategoryParamDto, deleteCategoryParamSchema } from './dto/delete-category.dto'

@ApiTags('Categories')
@Controller('/api/categories/:categoryId')
export class DeleteCategoryController {
	constructor(private deleteCategory: DeleteCategoryUseCase) {}

	@ApiOperation({ summary: 'delete category and clear related references' })
	@ApiNoContentResponse({ description: 'Category deleted successfully' })
	@ApiNotFoundResponse({ description: 'Category not found', type: ApiErrorResponseDto })
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
				case NotAllowedError:
					throw new NotFoundException('Category not found')

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
