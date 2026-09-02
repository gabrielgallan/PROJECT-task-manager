import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Patch,
} from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditCategoryUseCase } from '@/domain/task-manager/application/use-cases/edit-category'
import { InvalidCategoryError } from '@/domain/task-manager/application/use-cases/errors/invalid-category-error'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import {
	EditCategoryDto,
	EditCategoryParamDto,
	editCategoryParamSchema,
	editCategorySchema,
} from './dto/edit-category.dto'

@ApiTags('Categories')
@Controller('/api/categories/:categoryId')
export class EditCategoryController {
	constructor(private editCategory: EditCategoryUseCase) {}

	@ApiOperation({ summary: 'edit category' })
	@ApiNoContentResponse({ description: 'Category edited successfully' })
	@ApiBadRequestResponse({ description: 'Invalid category name or color', type: ApiErrorResponseDto })
	@ApiNotFoundResponse({ description: 'Category not found', type: ApiErrorResponseDto })
	@Patch()
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
				case NotAllowedError:
					throw new NotFoundException('Category not found')

				case InvalidCategoryError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
